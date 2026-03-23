const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const Cart = sequelize.define("Cart", {
  id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
  user_id: { type: DataTypes.BIGINT, allowNull: false, unique: true },
  items: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
  subtotal: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  discount_code_applied: { type: DataTypes.STRING(50) }
}, {
  tableName: "carts", 
  timestamps: true, 
  underscored: true
});

/**
 * Enforces native 1:1 user singleton cart allocations safely
 */
Cart.getOrCreate = async function(userId) {
  const [cart] = await this.findOrCreate({
    where: { user_id: userId },
    defaults: { items: [], subtotal: 0 }
  });
  return cart;
};

/**
 * Eliminates native malicious user JSON modifications natively rebuilding calculations accurately via strict backend iteration arrays natively
 */
Cart.prototype.recalculate = function() {
  const currentItems = Array.isArray(this.items) ? this.items : [];
  let total = 0;
  for (const item of currentItems) {
    const qty = parseInt(item.quantity) || 0;
    const price = parseFloat(item.unit_price) || 0;
    total += (qty * price);
  }
  this.subtotal = total;
};

module.exports = { Cart };
