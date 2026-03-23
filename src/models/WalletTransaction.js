const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const WalletTransaction = sequelize.define(
  "WalletTransaction",
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    wallet_id: { type: DataTypes.BIGINT, allowNull: false },
    amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    type: { type: DataTypes.ENUM("CREDIT", "DEBIT") },
    reference_id: { type: DataTypes.BIGINT },
    description: { type: DataTypes.STRING(200) },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  {
    tableName: "wallet_transactions",
    timestamps: false,
    underscored: true,
  }
);

module.exports = { WalletTransaction };
