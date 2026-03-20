const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const Payment = sequelize.define(
  "Payment",
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    tenant_id: { type: DataTypes.BIGINT, allowNull: false },
    user_id: { type: DataTypes.BIGINT, allowNull: false },
    reference_type: { type: DataTypes.ENUM("BOOKING", "ORDER"), allowNull: false },
    reference_id: { type: DataTypes.BIGINT, allowNull: false },
    amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    currency: { type: DataTypes.STRING(3), defaultValue: "INR" },
    payment_method: { type: DataTypes.STRING(50) },
    provider_transaction_id: { type: DataTypes.STRING(100) },
    status: {
      type: DataTypes.ENUM("PENDING", "SUCCESS", "FAILED", "CANCELLED"),
      defaultValue: "PENDING",
    },
    metadata: { type: DataTypes.JSONB },
  },
  {
    tableName: "payments",
    timestamps: true,
    underscored: true,
  }
);

module.exports = { Payment };
