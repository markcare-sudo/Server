const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const Order = sequelize.define(
  "Order",
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    tenant_id: { type: DataTypes.BIGINT, allowNull: false },
    customer_id: { type: DataTypes.BIGINT, allowNull: false },
    order_number: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    subtotal: { type: DataTypes.DECIMAL(10, 2) },
    discount_amount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    tax_amount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    total_amount: { type: DataTypes.DECIMAL(10, 2) },
    payment_method: { type: DataTypes.STRING(50) },
    payment_status: {
      type: DataTypes.ENUM("PENDING", "COMPLETED", "FAILED"),
      defaultValue: "PENDING",
    },
    order_status: {
      type: DataTypes.ENUM("PLACED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "RETURNED"),
      defaultValue: "PLACED",
    },
    shipping_address: { type: DataTypes.JSONB },
    delivery_date: { type: DataTypes.DATEONLY },
    notes: { type: DataTypes.TEXT },
  },
  {
    tableName: "orders",
    timestamps: true,
    underscored: true,
    hooks: {
      beforeCreate: async (order, options) => {
        if (!order.order_number) {
          const year = new Date().getFullYear();
          // We utilize max ID derivation cleanly mapped inside transactions natively scaling sequential logic safely
          const maxId = await sequelize.models.Order.max("id", { transaction: options.transaction }) || 0;
          const assignedNumeric = maxId + 1;
          
          order.order_number = `MC-${year}-${String(assignedNumeric).padStart(5, "0")}`;
        }
      },
    },
  }
);

/**
 * Validates logical cancellation constraints preventing shipments from halting natively.
 */
Order.prototype.canBeCancelled = function() {
  return ["PLACED", "PROCESSING"].includes(this.order_status);
};

module.exports = { Order };
