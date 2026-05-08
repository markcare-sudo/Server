const razorpay = require("../../../config/razorpay");
const { sequelize } = require("../../../config/db");
const ApiError = require("../../../core/errors/ApiError");
const Payment = require("../orders/payment.model");
const ServiceBooking = require("./serviceBooking.model");
const crypto = require("crypto");
const { User } = require("../ima/users/user.model");
const { Service } = require("../service/service.model");
const Address = require("../address/address.model");

const generateBookingCode = () => `MCB-${Date.now()}`;

/**
 * CREATE SERVICE BOOKING
 */
async function createBooking(user_id, data) {
    const {
        service_id,
        address_id,
        scheduled_date,
        time_slot,
        payment_method,
        notes,
        total_amount
    } = data;

    // Use a transaction to ensure both booking and payment records are created together
    return await sequelize.transaction(async (t) => {

        // 1. Create the Booking record
        const booking = await ServiceBooking.create({
            user_id,
            service_id,
            address_id,
            scheduled_date,
            time_slot,
            payment_method,
            total_amount,
            notes,
            booking_code: generateBookingCode(),
            status: payment_method === "COD" ? "CONFIRMED" : "PENDING",
            payment_status: payment_method === "COD" ? "UNPAID" : "PENDING"
        }, { transaction: t });

        let razorpayOrder = null;
        let payment = null;

        // 2. Online Payment Logic
        if (payment_method === "ONLINE") {
            // 1. Ensure amount is a rounded Integer
            const amountInPaise = Math.round(parseFloat(total_amount) * 100);

            try {
                // 2. Log exactly what you are sending to Razorpay
                console.log("Sending to Razorpay:", {
                    amount: amountInPaise,
                    currency: "INR",
                    receipt: `bk_${booking.id}`.slice(0, 40)
                });

                razorpayOrder = await razorpay.orders.create({
                    amount: amountInPaise,
                    currency: "INR",
                    receipt: `bk_${booking.id}`.slice(0, 40),
                });
            } catch (error) {
                // This log will tell us if it's a 401 (Bad Keys) or 400 (Bad Data)
                console.error("ACTUAL RAZORPAY ERROR:", JSON.stringify(error, null, 2));

                throw new ApiError(
                    error.statusCode || 500,
                    error.error?.description || "Razorpay integration failed"
                );
            }
        }

        // 3. COD Payment Logic
        if (payment_method === "COD") {
            payment = await Payment.create({
                order_id: booking.id,
                provider: "cod",
                amount: total_amount,
                status: "pending",
                transaction_id: null,
            }, { transaction: t });
        }

        return { booking, razorpayOrder, payment };
    });
}

/**
 * VERIFY SERVICE PAYMENT
 */
async function verifyPayment(data) {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
        } = data;

        // Step 1: Generate Signature for Verification
        const body = `${razorpay_order_id}|${razorpay_payment_id}`;
        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(body)
            .digest("hex");

        // Step 2: Compare signatures (security check)
        if (expectedSignature !== razorpay_signature) {
            throw new ApiError(400, "Invalid payment signature");
        }

        // Step 3: Update records in a transaction
        return await sequelize.transaction(async (t) => {
            const payment = await Payment.findOne({
                where: { transaction_id: razorpay_order_id },
                transaction: t
            });

            if (!payment) throw new ApiError(404, "Payment record not found");

            // Step 4: Update Payment Status
            await payment.update({
                status: "success",
                transaction_id: razorpay_payment_id,
                payment_response: data,
            }, { transaction: t });

            // Step 5: Update Booking Status
            const booking = await ServiceBooking.findByPk(payment.order_id, { transaction: t });
            if (!booking) throw new ApiError(404, "Booking not found");

            await booking.update({
                payment_status: "PAID",
                status: "CONFIRMED",
                // Storing actual payment ID in booking for reference
                transaction_id: razorpay_payment_id
            }, { transaction: t });

            return { success: true, booking };
        });

    } catch (error) {
        console.error("❌ Service Payment Verification Error:", error);
        throw error;
    }
}



// async function createBooking(user_id, data) {
//     const {
//         service_id,
//         address_id,
//         scheduled_date,
//         time_slot,
//         payment_method,
//         notes,
//         total_amount
//     } = data;

//     console.log(data)

//     if (!total_amount || Number(total_amount) <= 0) {
//         throw new ApiError(400, "Invalid total amount");
//     }

//     return await sequelize.transaction(async (t) => {

//         // =========================
//         // CREATE BOOKING
//         // =========================
//         const booking = await ServiceBooking.create({
//             user_id,
//             service_id,
//             address_id,
//             scheduled_date,
//             time_slot,
//             payment_method,
//             total_amount,
//             notes,
//             booking_code: generateBookingCode(),
//             status: payment_method === "COD" ? "CONFIRMED" : "PENDING",
//             payment_status: payment_method === "COD" ? "UNPAID" : "PENDING"
//         }, { transaction: t });

//         let razorpayOrder = null;
//         let payment = null;

//         // =========================
//         // 💳 ONLINE PAYMENT
//         // =========================
//         // Inside createBooking...
//         if (payment_method === "ONLINE") {
//             const amountInPaise = Math.round(Number(total_amount) * 100);

//             // 1. Verify razorpay instance exists
//             if (!razorpay) throw new ApiError(500, "Payment gateway not initialized");

//             try {
//                 razorpayOrder = await razorpay.orders.create({
//                     amount: amountInPaise,
//                     currency: "INR",
//                     receipt: `bk_${booking.id}`.slice(0, 40), // Safety slice
//                 });
//             } catch (err) {
//                 // This catches the error BEFORE the library's internal normalizeError crashes
//                 throw new ApiError(400, err.error?.description || "Razorpay Order Creation Failed");
//             }

//             payment = await Payment.create({
//                 order_id: booking.id,
//                 provider: "razorpay",
//                 amount: total_amount,
//                 status: "pending",
//                 transaction_id: razorpayOrder.id,
//             }, { transaction: t });
//         }

//         // =========================
//         // 💵 COD / COS PAYMENT
//         // =========================
//         if (payment_method === "COD") {
//             payment = await Payment.create({
//                 order_id: booking.id,
//                 provider: "cod",
//                 amount: total_amount,
//                 status: "pending",
//                 transaction_id: null,
//             }, { transaction: t });
//         }

//         return {
//             booking,
//             razorpayOrder,
//             payment
//         };
//     });
// }

// async function verifyPayment(data) {
//     try {
//         const {
//             razorpay_order_id,
//             razorpay_payment_id,
//             razorpay_signature,
//         } = data;

//         // =========================
//         // VERIFY SIGNATURE
//         // =========================
//         const body = `${razorpay_order_id}|${razorpay_payment_id}`;

//         const expectedSignature = crypto
//             .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
//             .update(body)
//             .digest("hex");

//         if (expectedSignature !== razorpay_signature) {
//             throw new ApiError(400, "Invalid payment signature");
//         }

//         // =========================
//         // FIND PAYMENT
//         // =========================
//         const payment = await Payment.findOne({
//             where: { transaction_id: razorpay_order_id },
//         });

//         if (!payment) {
//             throw new ApiError(404, "Payment not found");
//         }

//         // =========================
//         // UPDATE PAYMENT
//         // =========================
//         await payment.update({
//             status: "success",
//             transaction_id: razorpay_payment_id,
//             payment_response: data,
//         });

//         // =========================
//         // UPDATE BOOKING
//         // =========================
//         await ServiceBooking.update(
//             {
//                 payment_status: "PAID",
//                 status: "CONFIRMED",
//                 transaction_id: razorpay_payment_id
//             },
//             {
//                 where: { id: payment.order_id }
//             }
//         );

//         return { success: true };

//     } catch (error) {
//         console.error("❌ Payment Verification Error:", error);
//         throw error;
//     }
// }

async function getUserBookings(user_id) {
    return await ServiceBooking.findAll({
        where: { user_id },
        order: [["created_at", "DESC"]]
    });
}


async function getAllBookings(query = {}) {
    const {
        page = 1,
        limit = 10,
        search,
        status,
        payment_status,
        payment_method,
        startDate,
        endDate
    } = query;

    const offset = (page - 1) * limit;

    // =========================
    // 🔍 WHERE CONDITIONS
    // =========================
    let where = {};

    if (status) where.status = status;
    if (payment_status) where.payment_status = payment_status;
    if (payment_method) where.payment_method = payment_method;

    // 📅 Date filter
    if (startDate && endDate) {
        where.created_at = {
            [Op.between]: [new Date(startDate), new Date(endDate)]
        };
    }

    // 🔎 Search (booking_code / user)
    if (search) {
        where[Op.or] = [
            { booking_code: { [Op.iLike]: `%${search}%` } }
        ];
    }

    // =========================
    // 📦 QUERY
    // =========================
    const { count, rows } = await ServiceBooking.findAndCountAll({
        where,
        offset,
        limit: Number(limit),
        order: [["created_at", "DESC"]],

        include: [
            {
                model: User,
                as: "user",
                attributes: ["id", "name", "email"]
            },
            {
                model: Service,
                as: "service",
                attributes: ["id", "name"]
            },
            {
                model: Address,
                as: "address",
                attributes: ["id", "city", "state"]
            }
        ]
    });

    // =========================
    // 📊 PAGINATION
    // =========================
    return {
        data: rows,
        pagination: {
            total: count,
            page: Number(page),
            limit: Number(limit),
            totalPages: Math.ceil(count / limit)
        }
    };
}

async function getBookingById(id) {
    const booking = await ServiceBooking.findByPk(id);
    if (!booking) throw new ApiError(404, "Booking not found");
    return booking;
}

async function updateBooking(id, data) {
    const booking = await ServiceBooking.findByPk(id);
    if (!booking) throw new ApiError(404, "Booking not found");

    await booking.update(data);
    return booking;
}

async function assignTechnician(id, technician_id) {
    const booking = await ServiceBooking.findByPk(id);
    if (!booking) throw new ApiError(404, "Booking not found");

    await booking.update({
        technician_id,
        status: "ASSIGNED"
    });

    return booking;
}

async function cancelBooking(id) {
    const booking = await ServiceBooking.findByPk(id);
    if (!booking) throw new ApiError(404, "Booking not found");

    await booking.update({
        status: "CANCELLED"
    });

    return booking;
}

module.exports = {
    createBooking,
    verifyPayment,
    getUserBookings,
    getAllBookings,
    getBookingById,
    updateBooking,
    assignTechnician,
    cancelBooking
};