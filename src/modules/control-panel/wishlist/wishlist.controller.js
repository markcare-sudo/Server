const WishlistService = require("./wishlist.service");
const { ok } = require("../../../utils/apiResponse");
const asyncHandler = require("../../../utils/asyncHandler");

const getWishlist = asyncHandler(async (req, res) => {
    const data = await WishlistService.getWishlist(req.user.id);
    return ok(res, data);
});

const addItem = asyncHandler(async (req, res) => {
    const { product_variant_id } = req.body;

    const item = await WishlistService.addToWishlist(
        req.user.id,
        product_variant_id
    );

    return ok(res, item);
});

const removeItem = asyncHandler(async (req, res) => {
    const { item_id } = req.params;

    await WishlistService.removeFromWishlist(req.user.id, item_id);

    return ok(res, { message: "Removed from wishlist" });
});

const toggle = asyncHandler(async (req, res) => {
    const { product_variant_id } = req.body;

    const result = await WishlistService.toggleWishlist(
        req.user.id,
        product_variant_id
    );

    return ok(res, result);
});

module.exports = {
    getWishlist,
    addItem,
    removeItem,
    toggle,
};