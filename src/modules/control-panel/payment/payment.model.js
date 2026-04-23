const { DataTypes } = require("sequelize");
const { sequelize } = require("../../../config/db");

const Payment = sequelize.define("Payment", {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    order_id: { type: DataTypes.BIGINT, allowNull: false, },
    provider: { type: DataTypes.STRING(50), }, // razorpay / stripe
    payment_id: { type: DataTypes.STRING(100), },
    amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false, },
    status: { type: DataTypes.ENUM("pending", "success", "failed"), defaultValue: "pending", },
    raw_response: { type: DataTypes.JSONB, },

}, {
    tableName: "payments",
    timestamps: true,
    underscored: true,
});

module.exports = { Payment };