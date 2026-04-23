const { Wishlist, WishlistItem } = require("./wishlist.model");
const { ProductVariant } = require("../products/product.model");
const ApiError = require("../../../core/errors/ApiError");

/**
 * GET OR CREATE
 */
async function getOrCreateWishlist(user_id) {
    let wishlist = await Wishlist.findOne({ where: { user_id } });

    if (!wishlist) {
        wishlist = await Wishlist.create({ user_id });
    }

    return wishlist;
}

/**
 * ADD ITEM
 */
async function addToWishlist(user_id, product_variant_id) {
    const wishlist = await getOrCreateWishlist(user_id);

    // validate variant
    const variant = await ProductVariant.findByPk(product_variant_id);
    if (!variant) throw new ApiError(404, "Variant not found");

    const [item, created] = await WishlistItem.findOrCreate({
        where: {
            wishlist_id: wishlist.id,
            product_variant_id,
        },
    });

    return item;
}

/**
 * REMOVE ITEM
 */
async function removeFromWishlist(user_id, item_id) {
    const wishlist = await Wishlist.findOne({ where: { user_id } });

    const item = await WishlistItem.findOne({
        where: {
            id: item_id,
            wishlist_id: wishlist.id,
        },
    });

    if (!item) throw new ApiError(404, "Item not found");

    await item.destroy();

    return true;
}

/**
 * GET WISHLIST
 */
async function getWishlist(user_id) {
    return await Wishlist.findOne({
        where: { user_id },
        include: [
            {
                model: WishlistItem,
                as: "items",
                include: [
                    {
                        model: ProductVariant,
                        include: ["product"],
                    },
                ],
            },
        ],
    });
}

/**
 * TOGGLE (useful API)
 */
async function toggleWishlist(user_id, product_variant_id) {
    const wishlist = await getOrCreateWishlist(user_id);

    const existing = await WishlistItem.findOne({
        where: {
            wishlist_id: wishlist.id,
            product_variant_id,
        },
    });

    if (existing) {
        await existing.destroy();
        return { removed: true };
    }

    await WishlistItem.create({
        wishlist_id: wishlist.id,
        product_variant_id,
    });

    return { added: true };
}

module.exports = {
    getWishlist,
    addToWishlist,
    removeFromWishlist,
    toggleWishlist,
};