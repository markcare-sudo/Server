const { Cart, CartItem } = require("./cart.model");
const { ProductVariant } = require("../products/product.model");
const { sequelize } = require("../../../config/db");
const ApiError = require("../../../core/errors/ApiError");

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

        const cart = await getOrCreateCart(user_id);

        // 🔒 Lock cart row
        await Cart.findByPk(cart.id, { transaction: t, lock: t.LOCK.UPDATE });

        // ✅ Validate variant
        const variant = await ProductVariant.findByPk(product_variant_id, { transaction: t });
        if (!variant) throw new ApiError(404, "Variant not found");

        if (variant.stock_quantity < quantity) {
            throw new ApiError(400, "Insufficient stock");
        }

        const price = variant.discount_price || variant.price;

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

        await recalculateCart(cart.id, t);

        return item;
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
async function getCart(user_id) {
    const cart = await Cart.findOne({
        where: { user_id },
        include: [
            {
                model: CartItem,
                as: "items",
                include: [
                    {
                        model: ProductVariant,
                        include: ["product"]
                    }
                ]
            }
        ]
    });

    return cart;
}

/**
 * RECALCULATE TOTALS
 */
async function recalculateCart(cart_id, transaction) {
    const items = await CartItem.findAll({
        where: { cart_id },
        include: [{ model: ProductVariant }],
        transaction
    });

    let total = 0;
    let count = 0;

    for (const item of items) {
        const price = item.ProductVariant.discount_price || item.ProductVariant.price;
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