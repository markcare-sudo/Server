const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const OrderItem = sequelize.define(
  "OrderItem",
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    order_id: { type: DataTypes.BIGINT, allowNull: false },
    product_variant_id: { type: DataTypes.BIGINT },
    quantity: { type: DataTypes.INTEGER, allowNull: false },
    unit_price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    subtotal: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  },
  {
    tableName: "order_items",
    timestamps: false,
    underscored: true,
  }
);

module.exports = { OrderItem };
