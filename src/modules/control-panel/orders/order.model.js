const { DataTypes } = require("sequelize");
const { sequelize } = require("../../../config/db");

const Order = sequelize.define("Order", {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    user_id: { type: DataTypes.BIGINT, allowNull: false },
    address_id: { type: DataTypes.BIGINT, allowNull: false },

    total_amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    order_status: {
        type: DataTypes.ENUM("PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"),
        defaultValue: "PENDING"
    },
    payment_status: { type: DataTypes.ENUM("UNPAID", "PAID", "REFUNDED"), defaultValue: "UNPAID" },
    payment_method: { type: DataTypes.STRING(50) }, // e.g., 'Razorpay', 'Stripe', 'COD'
    transaction_id: { type: DataTypes.STRING(255) },
}, {
    tableName: "orders",
    timestamps: true,
    underscored: true,
    paranoid: false,
});

module.exports = Order;