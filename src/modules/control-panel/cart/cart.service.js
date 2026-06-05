const { Cart, CartItem } = require("./cart.model");
const { ProductVariant, Product, ProductImage } = require("../products/product.model");
const { sequelize } = require("../../../config/db");
const ApiError = require("../../../core/errors/ApiError");
const { Brand } = require("../brands/brand.model");



/**
 * GET OR CREATE CART
 */
async function getOrCreateCart(user_id, transaction) {
    let cart = await Cart.findOne({
        where: { user_id },
        transaction
    });

    if (!cart) {
        cart = await Cart.create(
            {
                user_id,
                total_amount: 0,
                item_count: 0
            },
            { transaction }
        );
    }

    return cart;
}

/**
 * ADD ITEM TO CART
 */
async function addToCart(user_id, { product_id, product_variant_id, quantity = 1 }) {
    return await sequelize.transaction(async (t) => {

        // 1. Get or create cart
        let cart = await getOrCreateCart(user_id, null, t);

        // 2. Validate variant
        const variant = await ProductVariant.findByPk(product_variant_id, {
            transaction: t,
            lock: t.LOCK.UPDATE
        });

        if (!variant) throw new ApiError(404, "Product variant not found");

        // 🔥 IMPORTANT: validate product_id matches variant
        if (variant.product_id !== product_id) {
            throw new ApiError(400, "Product mismatch with variant");
        }

        if (variant.stock_quantity < quantity) {
            throw new ApiError(400, "Insufficient stock");
        }

        // 🔥 3. UPDATE FIRST (prevents duplicate error)
        const [updatedCount] = await CartItem.update(
            {
                quantity: sequelize.literal(`quantity + ${quantity}`)
            },
            {
                where: {
                    cart_id: cart.id,
                    product_variant_id
                },
                transaction: t
            }
        );

        let item;

        if (updatedCount === 0) {
            // 🔥 4. CREATE if not exists
            try {
                item = await CartItem.create({
                    cart_id: cart.id,
                    product_id, // ✅ ADDED
                    product_variant_id,
                    quantity
                }, { transaction: t });

            } catch (error) {
                // 🔥 Handle race condition
                if (error.name === "SequelizeUniqueConstraintError") {
                    await CartItem.update(
                        {
                            quantity: sequelize.literal(`quantity + ${quantity}`)
                        },
                        {
                            where: {
                                cart_id: cart.id,
                                product_variant_id
                            },
                            transaction: t
                        }
                    );
                } else {
                    throw error;
                }
            }
        }

        // 5. Fetch final item
        const freshItem = await CartItem.findOne({
            where: {
                cart_id: cart.id,
                product_variant_id
            },
            transaction: t,
            include: [{
                model: ProductVariant,
                as: "variant",
                include: [{
                    model: Product,
                    as: "product",
                    include: [
                        { model: ProductImage, as: "images" },
                        { model: Brand, as: "brand" }
                    ]
                }]
            }]
        });

        if (!freshItem) {
            throw new ApiError(500, "Failed to fetch cart item");
        }

        // 🔥 6. Final stock check
        if (freshItem.quantity > variant.stock_quantity) {
            throw new ApiError(400, "Stock exceeded");
        }

        // 7. Recalculate
        await recalculateCart(cart.id, t);

        // 8. Format response
        const itemJson = freshItem.get({ plain: true });

        const { variant: variantData, ...itemRest } = itemJson;
        const { product, ...vRest } = variantData;

        return {
            ...itemRest,
            message: "Item Added Successfully!",
            product: {
                ...product,
                selected_variant: vRest
            }
        };
    });
}

/**
 * UPDATE ITEM QUANTITY
 */
async function updateCartItem(user_id, item_id, quantity) {
    return await sequelize.transaction(async (t) => {

        const cart = await Cart.findOne({ where: { user_id }, transaction: t });

        const item = await CartItem.findOne({
            where: { id: item_id, cart_id: cart.id },
            transaction: t
        });

        if (!item) throw new ApiError(404, "Cart item not found");

        if (quantity <= 0) {
            await item.destroy({ transaction: t });
        } else {
            item.quantity = quantity;
            await item.save({ transaction: t });
        }

        await recalculateCart(cart.id, t);

        return item;
    });
}

/**
 * REMOVE ITEM
 */
async function removeCartItem(user_id, item_id) {
    return await sequelize.transaction(async (t) => {

        const cart = await Cart.findOne({
            where: { user_id },
            transaction: t
        });

        if (!cart) throw new ApiError(404, "Cart not found");

        const item = await CartItem.findOne({
            where: { id: item_id, cart_id: cart.id },
            transaction: t
        });

        if (!item) throw new ApiError(404, "Cart item not found");

        // 🔥 HARD DELETE (permanent)
        await item.destroy({
            force: true, // ✅ this bypasses paranoid soft delete
            transaction: t
        });

        await recalculateCart(cart.id, t);

        return true;
    });
}

/**
 * GET CART DETAILS
 */
const getCart = async (user_id) => {
    // 1. Fetch data using the exact aliases defined in your associations
    const cart = await Cart.findOne({
        where: { user_id },
        include: [
            {
                model: CartItem,
                as: "items", // Matches: Cart.hasMany(CartItem, { as: "items" })
                include: [
                    {
                        model: ProductVariant,
                        as: "variant", // Matches: CartItem.belongsTo(ProductVariant, { as: "variant" })
                        include: [
                            {
                                model: Product,
                                as: "product", // Matches: ProductVariant.belongsTo(Product, { as: "product" })
                                include: [
                                    {
                                        model: ProductImage,
                                        as: "images", // Matches: Product.hasMany(ProductImage, { as: "images" })
                                        attributes: ["id", "url", "is_primary"]
                                    },
                                    {
                                        model: Brand,
                                        as: "brand",
                                        attributes: ["id", "name"]
                                    }
                                ]
                            }
                        ]
                    }
                ]
            }
        ],
        order: [[{ model: CartItem, as: "items" }, "created_at", "DESC"]]
    });

    if (!cart) return null;

    // 2. Transform the Sequelize instance to a plain JSON object
    const cartJson = cart.get({ plain: true });



    // 3. Restructure: Move "variant" inside "product" for each item
    cartJson.items = cartJson.items.map((item) => {
        // Use destructuring to pull the original objects apart
        const { variant, ...itemData } = item;

        if (variant && variant.product) {
            const { product, ...variantData } = variant;

            return {
                ...itemData,
                product: {
                    ...product,
                    selected_variant: variantData // Variant is now nested inside Product
                }
            };
        }

        return item;
    });

    return cartJson;
};

/**
 * RECALCULATE TOTALS
 */
async function recalculateCart(cart_id, transaction) {
    const items = await CartItem.findAll({
        where: { cart_id },
        include: [{ model: ProductVariant, as: "variant" }],
        transaction
    });

    let total = 0;
    let count = 0;

    for (const item of items) {
        const price = item.variant.price;
        total += price * item.quantity;
        count += item.quantity;
    }

    await Cart.update(
        {
            total_amount: total,
            item_count: count
        },
        { where: { id: cart_id }, transaction }
    );
}

module.exports = {
    getCart,
    addToCart,
    updateCartItem,
    removeCartItem
};