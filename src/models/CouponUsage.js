const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const CouponUsage = sequelize.define("CouponUsage", {
  id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
  coupon_id: { type: DataTypes.BIGINT, allowNull: false },
  user_id: { type: DataTypes.BIGINT, allowNull: false },
  order_id: { type: DataTypes.BIGINT },
  booking_id: { type: DataTypes.BIGINT },
  used_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
  tableName: "coupon_usages",
  timestamps: false,
  underscored: true
});

module.exports = { CouponUsage };
