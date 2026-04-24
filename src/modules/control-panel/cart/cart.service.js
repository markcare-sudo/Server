const { Cart, CartItem } = require("./cart.model");
const { ProductVariant, Product, ProductImage } = require("../products/product.model");
const { sequelize } = require("../../../config/db");
const ApiError = require("../../../core/errors/ApiError");
const { Brand } = require("../brands/brand.model");



/**
 * GET OR CREATE CART
 */
async function getOrCreateCart(user_id, session_id = null) {
    let cart = await Cart.findOne({ where: { user_id } });

    if (!cart) {
        cart = await Cart.create({ user_id, session_id });
    }

    return cart;
}

/**
 * ADD ITEM TO CART
 */
async function addToCart(user_id, { product_variant_id, quantity = 1 }) {
    return await sequelize.transaction(async (t) => {

        const cart = await getOrCreateCart(user_id, null, t);

        // 2. Validate the specific variant
        const variant = await ProductVariant.findByPk(product_variant_id, {
            transaction: t,
            lock: t.LOCK.SHARE
        });

        if (!variant) throw new ApiError(404, "Product variant not found");
        if (variant.stock_quantity < quantity) throw new ApiError(400, "Insufficient stock");

        // 3. Handle the Cart Item (Find existing or Create new)
        let item = await CartItem.findOne({
            where: { cart_id: cart.id, product_variant_id },
            transaction: t
        });

        if (item) {
            item.quantity += quantity;
            await item.save({ transaction: t });
        } else {
            item = await CartItem.create({
                cart_id: cart.id,
                product_variant_id,
                quantity,
            }, { transaction: t });
        }

        // 4. Recalculate totals (Make sure this helper uses 'as: "variant"')
        await recalculateCart(cart.id, t);

        // 5. Final Fetch with correct Aliasing and Images
        const freshItem = await CartItem.findByPk(item.id, {
            transaction: t,
            include: [{
                model: ProductVariant,
                as: "variant", // 🔥 Matches your association alias
                include: [{
                    model: Product,
                    as: "product",
                    include: [
                        { model: ProductImage, as: "images" }, // ✅ Added images
                        { model: Brand, as: "brand" }         // ✅ Added brand
                    ]
                }]
            }]
        });

        // 6. Restructure for Frontend
        const itemJson = freshItem.get({ plain: true });
        const { variant: vData, ...itemRest } = itemJson;
        const { product: pData, ...vRest } = vData;

        return {
            ...itemRest,
            product: {
                ...pData,
                selected_variant: vRest // Variant is now nested inside Product
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

        const cart = await Cart.findOne({ where: { user_id }, transaction: t });

        const item = await CartItem.findOne({
            where: { id: item_id, cart_id: cart.id },
            transaction: t
        });

        if (!item) throw new ApiError(404, "Cart item not found");

        await item.destroy({ transaction: t });

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
        const price = item.variant.discount_price || item.variant.price;
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