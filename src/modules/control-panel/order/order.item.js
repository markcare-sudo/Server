const { DataTypes } = require("sequelize");
const { sequelize } = require("../../../config/db");

/**
 * ORDER
 */
const Order = sequelize.define("Order", {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    user_id: { type: DataTypes.BIGINT, allowNull: false, },
    order_number: { type: DataTypes.STRING(50), unique: true, },
    total_amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false, },
    currency: { type: DataTypes.STRING(10), defaultValue: "INR", },
    order_status: {
        type: DataTypes.ENUM("PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"),
        defaultValue: "PENDING"
    },
    payment_status: { type: DataTypes.ENUM("PENDING", "PAID", "FAILED", "REFUNDED"), defaultValue: "PENDING" },
    payment_method: { type: DataTypes.STRING(50) }, // e.g., 'Razorpay', 'Stripe', 'COD'
    transaction_id: { type: DataTypes.STRING(255) },
    shipping_address: { type: DataTypes.JSONB, allowNull: false, },
    billing_address: { type: DataTypes.JSONB, allowNull: false, },
}, {
    tableName: "orders",
    timestamps: true,
    underscored: true,
    indexes: [
        { unique: true, fields: ["order_id", "product_variant_id"] },
    ],
});

const OrderItem = sequelize.define("OrderItem", {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    order_id: { type: DataTypes.BIGINT, allowNull: false, onDelete: "CASCADE", },
    product_variant_id: { type: DataTypes.BIGINT, allowNull: false, },
    product_name: { type: DataTypes.STRING(255), allowNull: false, },
    price: { type: DataTypes.DECIMAL(12, 2), allowNull: false, },
    quantity: { type: DataTypes.INTEGER, allowNull: false, },
    total: { type: DataTypes.DECIMAL(12, 2), allowNull: false, },

}, {
    tableName: "order_items",
    timestamps: true,
    underscored: true,
    indexes: [
        { unique: true, fields: ["order_id", "product_variant_id"] },
    ],
});

module.exports = { Order, OrderItem };