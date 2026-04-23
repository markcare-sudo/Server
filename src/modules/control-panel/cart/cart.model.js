const { DataTypes } = require("sequelize");
const { sequelize } = require("../../../config/db");

/**
 * CART: The high-level container for a user's shopping session.
 */
const Cart = sequelize.define(
    "Cart",
    {
        id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true, },

        user_id: { type: DataTypes.BIGINT, allowNull: false, unique: true, references: { model: "users", key: "id", }, },
        session_id: { type: DataTypes.STRING(100), allowNull: true, },
        total_amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0.0, validate: { min: 0, }, },

        item_count: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, validate: { min: 0, }, },
    },
    {
        tableName: "carts",
        timestamps: true,
        underscored: true,
        paranoid: true, // soft delete

        indexes: [
            { unique: true, fields: ["user_id"] },
            { fields: ["created_at"] },
        ],

        defaultScope: {
            attributes: { exclude: [] },
        },
    }
);

/**
 * CART_ITEM: The junction between Carts and Product Variants.
 */
const CartItem = sequelize.define(
    "CartItem",
    {
        id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true, },

        cart_id: { type: DataTypes.BIGINT, allowNull: false, references: { model: "carts", key: "id" }, onDelete: "CASCADE", onUpdate: "CASCADE", },
        product_variant_id: { type: DataTypes.BIGINT, allowNull: false, references: { model: "product_variants", key: "id" }, onDelete: "CASCADE", onUpdate: "CASCADE", },
        quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1, validate: { min: 1, max: 1000, }, },
    },
    {
        tableName: "cart_items",
        timestamps: true,
        underscored: true,
        paranoid: true,

        indexes: [
            {
                unique: true,
                fields: ["cart_id", "product_variant_id"],
            },
            { fields: ["cart_id"] },
            { fields: ["product_variant_id"] },
        ],
    }
);

module.exports = { Cart, CartItem };