const { DataTypes } = require("sequelize");
const { sequelize } = require("../../../config/db");

/**
 * WISHLIST (1 per user)
 */
const Wishlist = sequelize.define(
    "Wishlist",
    {
        id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true, },
        user_id: { type: DataTypes.BIGINT, allowNull: false, unique: true, references: { model: "users", key: "id", }, },
    },
    {
        tableName: "wishlists",
        timestamps: true,
        underscored: true,

        indexes: [
            { unique: true, fields: ["user_id"] },
        ],
    }
);

/**
 * WISHLIST ITEM
 */
const WishlistItem = sequelize.define(
    "WishlistItem",
    {
        id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true, },
        wishlist_id: { type: DataTypes.BIGINT, allowNull: false, references: { model: "wishlists", key: "id", }, onDelete: "CASCADE", },
        product_variant_id: { type: DataTypes.BIGINT, allowNull: false, references: { model: "product_variants", key: "id", }, },
    },
    {
        tableName: "wishlist_items",
        timestamps: true,
        underscored: true,

        indexes: [
            {
                unique: true,
                fields: ["wishlist_id", "product_variant_id"],
            },
        ],
    }
);

module.exports = { Wishlist, WishlistItem };