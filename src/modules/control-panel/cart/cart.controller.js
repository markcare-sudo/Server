const CartService = require("./cart.service");
const { ok } = require("../../../utils/apiResponse");
const asyncHandler = require("../../../utils/asyncHandler");

/**
 * GET CART
 */
const getCart = asyncHandler(async (req, res) => {
    const cart = await CartService.getCart(req.user.id);
    return ok(res, cart);
});

/**
 * ADD ITEM
 */
const addItem = asyncHandler(async (req, res) => {
    const { product_variant_id, quantity } = req.body;

    const item = await CartService.addToCart(req.user.id, {
        product_variant_id,
        quantity
    });

    return ok(res, item);
});

/**
 * UPDATE ITEM
 */
const updateItem = asyncHandler(async (req, res) => {
    const { item_id } = req.params;
    const { quantity } = req.body;

    const item = await CartService.updateCartItem(
        req.user.id,
        item_id,
        quantity
    );

    return ok(res, item);
});

/**
 * REMOVE ITEM
 */
const removeItem = asyncHandler(async (req, res) => {
    const { item_id } = req.params;

    await CartService.removeCartItem(req.user.id, item_id);

    return ok(res, { message: "Item removed" });
});

module.exports = {
    getCart,
    addItem,
    updateItem,
    removeItem
};