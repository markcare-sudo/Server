// order.service.js
const { sequelize } = require("../../../config/db");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const Order = require("./order.model");
const OrderItem = require("./orderItem.model");
const Payment = require("./payment.model");
const { Cart, CartItem } = require("../cart/cart.model"); // adjust path
const { ProductVariant, Product, ProductImage } = require("../products/product.model");
const ApiError = require("../../../core/errors/ApiError");
const { User } = require("../ima/users/user.model");

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/**
 * CREATE ORDER (cart or single)
 */
async function createOrder(user_id, data) {
    const { address_id, items, payment_method, from_cart } = data;

    return await sequelize.transaction(async (t) => {
        let orderItems = [];

        // =========================
        // 🛒 FROM CART
        // =========================
        if (from_cart) {
            const cart = await Cart.findOne({ where: { user_id }, include: ["items"], transaction: t });

            if (!cart || !cart.items.length) {
                throw new ApiError(400, "Cart is empty");
            }

            for (const item of cart.items) {
                const variant = await ProductVariant.findByPk(item.variant_id);

                orderItems.push({
                    product_id: item.product_id,
                    variant_id: item.variant_id,
                    quantity: item.quantity,
                    unit_price: variant.price,
                    subtotal: variant.price * item.quantity,
                });
            }
        }

        // =========================
        // ⚡ SINGLE BUY
        // =========================
        else {
            for (const item of items) {
                const variant = await ProductVariant.findByPk(item.variant_id);

                orderItems.push({
                    product_id: item.product_id,
                    variant_id: item.variant_id,
                    quantity: item.quantity,
                    unit_price: variant.price,
                    subtotal: variant.price * item.quantity,
                });
            }
        }

        const total_amount = orderItems.reduce((sum, i) => sum + i.subtotal, 0);

        // =========================
        // CREATE ORDER
        // =========================
        const order = await Order.create(
            {
                user_id,
                address_id,
                total_amount,
                payment_method,
            },
            { transaction: t }
        );

        // =========================
        // CREATE ORDER ITEMS
        // =========================
        await OrderItem.bulkCreate(
            orderItems.map((i) => ({ ...i, order_id: order.id })),
            { transaction: t }
        );

        // =========================
        // CREATE RAZORPAY ORDER
        // =========================
        const razorpayOrder = await razorpay.orders.create({
            amount: Math.round(total_amount * 100), // paisa
            currency: "INR",
            receipt: `order_${order.id}`,
        });

        // =========================
        // CREATE PAYMENT ENTRY
        // =========================
        const payment = await Payment.create(
            {
                order_id: order.id,
                provider: "razorpay",
                amount: total_amount,
                status: "pending",
                transaction_id: razorpayOrder.id,
            },
            { transaction: t }
        );

        return {
            order,
            razorpayOrder,
            payment,
        };
    });
}

/**
 * VERIFY PAYMENT
 */
async function verifyPayment(data) {
    const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
    } = data;

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest("hex");

    if (expectedSignature !== razorpay_signature) {
        throw new ApiError(400, "Invalid payment signature");
    }

    const payment = await Payment.findOne({
        where: { transaction_id: razorpay_order_id },
    });

    if (!payment) throw new ApiError(404, "Payment not found");

    // update payment
    await payment.update({
        status: "success",
        transaction_id: razorpay_payment_id,
        payment_response: data,
    });

    // update order
    await Order.update(
        { payment_status: "PAID", order_status: "CONFIRMED" },
        { where: { id: payment.order_id } }
    );

    const cart = await Cart.findOne({
        where: { user_id },
    });

    if (!cart) return;

    await CartItem.destroy({
        where: { cart_id: cart.id },
    });

    return { success: true };
}

// =========================
// 📦 LIST ORDERS
// =========================




// async function verifyPayment(data) {
//     try {
//         const {
//             razorpay_order_id,
//             razorpay_payment_id,
//             razorpay_signature,
//         } = data;

//         console.log("========== 🔍 PAYMENT VERIFICATION START ==========");
//         console.log("➡️ Incoming Data:", {
//             razorpay_order_id,
//             razorpay_payment_id,
//             razorpay_signature,
//         });

//         // ✅ Step 1: Create body
//         const body = `${razorpay_order_id}|${razorpay_payment_id}`;
//         console.log("➡️ Generated Body:", body);

//         // ✅ Step 2: Generate expected signature
//         const expectedSignature = crypto
//             .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
//             .update(body)
//             .digest("hex");

//         console.log("➡️ Expected Signature:", expectedSignature);
//         console.log("➡️ Received Signature:", razorpay_signature);

//         // ✅ Step 3: Compare
//         if (expectedSignature !== razorpay_signature) {
//             console.error("❌ SIGNATURE MISMATCH");
//             console.error("Check:");
//             console.error("- Razorpay Secret Key");
//             console.error("- Order ID / Payment ID mismatch");
//             console.error("- Test vs Live key mismatch");

//             throw new Error("Invalid payment signature");
//         }

//         console.log("✅ Signature verified successfully");

//         // ✅ Step 4: Find payment
//         const payment = await Payment.findOne({
//             where: { transaction_id: razorpay_order_id },
//         });

//         console.log("➡️ Payment Found:", payment ? payment.id : "NOT FOUND");

//         if (!payment) {
//             console.error("❌ Payment not found in DB");
//             throw new Error("Payment not found");
//         }

//         // ✅ Step 5: Update payment
//         await payment.update({
//             status: "success",
//             transaction_id: razorpay_payment_id,
//             payment_response: data,
//         });

//         console.log("✅ Payment updated");

//         // ✅ Step 6: Update order
//         await Order.update(
//             {
//                 payment_status: "PAID",
//                 order_status: "CONFIRMED",
//             },
//             {
//                 where: { id: payment.order_id },
//             }
//         );

//         console.log("✅ Order updated");

//         // ⚠️ BUG FIX: user_id missing in your original code
//         // 👉 you MUST pass user_id to this function OR fetch from order

//         const order = await Order.findByPk(payment.order_id);

//         if (order) {
//             await Cart.destroy({
//                 where: { user_id: order.user_id },
//             });
//             console.log("🛒 Cart cleared");
//         }

//         console.log("========== ✅ PAYMENT VERIFIED SUCCESS ==========");

//         return { success: true };

//     } catch (error) {
//         console.error("========== ❌ VERIFICATION FAILED ==========");
//         console.error(error.message);
//         console.error("Full Error:", error);
//         throw error;
//     }
// }

async function listAllOrders(query = {}) {
    const {
        page = 1,
        limit = 10,
        status,
        paymentStatus,
        search,
        startDate,
        endDate,
    } = query;

    const parsedLimit = parseInt(limit) || 10;
    const offset = (Math.max(1, parseInt(page)) - 1) * parsedLimit;

    // ✅ Dynamic filters for admin
    const where = {};

    if (status) {
        where.order_status = status;
    }

    if (paymentStatus) {
        where.payment_status = paymentStatus;
    }

    // Optional date filter
    if (startDate && endDate) {
        where.created_at = {
            [Op.between]: [new Date(startDate), new Date(endDate)],
        };
    }

    const { count, rows } = await Order.findAndCountAll({
        where,

        distinct: true,

        attributes: [
            "id",
            "user_id",
            "address_id",
            "total_amount",
            "order_status",
            "payment_status",
            "payment_method",
            "created_at",
        ],

        include: [
            {
                model: User,
                as: "user",
                attributes: ["id", "name", "email"],
                required: false,
            },

            {
                model: OrderItem,
                as: "items",
                attributes: [
                    "id",
                    "product_id",
                    "variant_id",
                    "quantity",
                    "unit_price",
                    "subtotal",
                ],
                required: false,

                include: [
                    {
                        model: ProductVariant,
                        as: "variant",
                        attributes: ["id", "price", "stock_quantity"],
                        required: false,

                        include: [
                            {
                                model: Product,
                                as: "product",
                                attributes: ["id", "name", "slug"],
                                required: false,
                            },
                            {
                                model: ProductImage,
                                as: "variant_images",
                                attributes: ["id", "url"],
                                required: false,
                            },
                        ],
                    },
                ],
            },

            {
                model: Payment,
                as: "payment",
                attributes: [
                    "id",
                    "provider",
                    "status",
                    "transaction_id",
                    "amount",
                ],
                required: false,
            },
        ],

        limit: parsedLimit,
        offset,
        order: [["created_at", "DESC"]],
    });

    return {
        data: rows,
        pagination: {
            totalItems: count,
            totalPages: Math.ceil(count / parsedLimit),
            currentPage: Number(page),
        },
    };
}


async function listOrders(user_id, query = {}) {
    const { page = 1, limit = 10 } = query;

    const parsedLimit = parseInt(limit) || 10;
    const offset = (Math.max(1, parseInt(page)) - 1) * parsedLimit;

    const { count, rows } = await Order.findAndCountAll({
        where: { user_id },

        distinct: true, // ✅ FIX count issue

        attributes: [
            "id",
            "user_id",
            "address_id",
            "total_amount",
            "order_status",
            "payment_status",
            "payment_method",
            "created_at",
        ],

        include: [
            {
                model: OrderItem,
                as: "items",
                attributes: [
                    "id",
                    "product_id",
                    "variant_id",
                    "quantity",
                    "unit_price",
                    "subtotal"
                ],
                required: false,

                include: [
                    {
                        model: ProductVariant,
                        as: "variant",
                        attributes: [
                            "id",
                            "price",
                            "stock_quantity"
                        ],
                        required: false,

                        include: [
                            {
                                model: Product,
                                as: "product", // ✅ alias match
                                attributes: ["id", "name", "slug"],
                                required: false
                            },
                            {
                                model: ProductImage,
                                as: "variant_images", // ✅ alias match
                                attributes: ["id", "url"],
                                required: false
                            }
                        ]
                    }
                ]
            },
            {
                model: Payment,
                as: "payment",
                attributes: [
                    "id",
                    "provider",
                    "status",
                    "transaction_id",
                    "amount"
                ],
                required: false
            }
        ],

        limit: parsedLimit,
        offset,
        order: [["created_at", "DESC"]],
    });

    return {
        data: rows,
        pagination: {
            totalItems: count,
            totalPages: Math.ceil(count / parsedLimit),
            currentPage: Number(page),
        },
    };
}

// =========================
// 📦 GET ORDER DETAILS
// =========================
async function getOrderById(user_id, order_id) {
    const order = await Order.findOne({
        where: { id: order_id, user_id },

        attributes: [
            "id",
            "user_id",
            "address_id",
            "total_amount",
            "order_status",
            "payment_status",
            "payment_method",
            "created_at",
            "updated_at",
        ],

        include: [
            {
                model: OrderItem,
                as: "items",
                attributes: [
                    "id",
                    "product_id",
                    "variant_id",
                    "quantity",
                    "unit_price",
                    "subtotal",
                ],
                required: false,

                include: [
                    {
                        model: ProductVariant,
                        as: "variant",
                        attributes: [
                            "id",
                            "price",
                            "stock_quantity",
                        ],
                        required: false,

                        include: [
                            {
                                model: Product,
                                as: "product", // ✅ FIXED alias
                                attributes: ["id", "name", "slug"],
                                required: false,
                            },
                            {
                                model: ProductImage,
                                as: "variant_images", // ✅ if exists
                                attributes: ["id", "url"],
                                required: false,
                            }
                        ]
                    }
                ]
            },
            {
                model: Payment,
                as: "payment",
                attributes: [
                    "id",
                    "provider",
                    "status",
                    "transaction_id",
                    "amount",
                ],
                required: false,
            }
        ],
    });

    if (!order) throw new ApiError(404, "Order not found");

    return order;
}

// =========================
// ❌ CANCEL ORDER
// =========================
async function cancelOrder(user_id, order_id) {
    const order = await Order.findOne({
        where: { id: order_id, user_id },
    });

    if (!order) throw new ApiError(404, "Order not found");

    if (order.order_status === "DELIVERED") {
        throw new ApiError(400, "Delivered order cannot be cancelled");
    }

    await order.update({
        order_status: "CANCELLED",
    });

    return order;
}

// =========================
// 🛠️ ADMIN UPDATE STATUS
// =========================
async function updateOrderStatus(order_id, status) {
    const order = await Order.findByPk(order_id);

    if (!order) throw new ApiError(404, "Order not found");

    await order.update({ order_status: status });

    return order;
}

// =========================
// 🗑️ DELETE ORDER (optional)
// =========================
async function deleteOrder(order_id) {
    const order = await Order.findByPk(order_id);

    if (!order) throw new ApiError(404, "Order not found");

    await order.destroy();
}

module.exports = {
    createOrder,
    verifyPayment,
    listAllOrders,
    listOrders,
    getOrderById,
    cancelOrder,
    updateOrderStatus,
    deleteOrder,
};