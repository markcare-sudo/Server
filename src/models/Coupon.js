const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const Coupon = sequelize.define("Coupon", {
  id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
  tenant_id: { type: DataTypes.BIGINT, allowNull: false },
  code: { type: DataTypes.STRING(50), allowNull: false, unique: true },
  discount_type: { type: DataTypes.ENUM("PERCENTAGE", "FIXED", "FREE_DELIVERY"), allowNull: false },
  discount_value: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  max_discount: { type: DataTypes.DECIMAL(10, 2) },
  min_purchase_amount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  applicable_to: { type: DataTypes.ENUM("ALL", "SERVICES", "PRODUCTS"), defaultValue: "ALL" },
  max_uses: { type: DataTypes.INTEGER },
  current_uses: { type: DataTypes.INTEGER, defaultValue: 0 },
  valid_from: { type: DataTypes.DATEONLY, allowNull: false },
  valid_till: { type: DataTypes.DATEONLY, allowNull: false },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
}, {
  tableName: "coupons",
  timestamps: true,
  underscored: true
});

module.exports = { Coupon };
