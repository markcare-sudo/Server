const { DataTypes, Op } = require("sequelize");
const { sequelize } = require("../config/db");
const AppError = require("../utils/AppError");

const ProductVariant = sequelize.define(
  "ProductVariant",
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    product_id: { type: DataTypes.BIGINT, allowNull: false },
    name: { type: DataTypes.STRING(200) },
    sku: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    price: { type: DataTypes.DECIMAL(10, 2) },
    quantity_in_stock: { type: DataTypes.INTEGER, defaultValue: 0 },
  },
  {
    tableName: "product_variants",
    timestamps: true,
    underscored: true,
  }
);

/**
 * Safely decrements variant inventory using literal mathematics mitigating concurrency.
 * @param {number|string} variantId 
 * @param {number} quantity 
 * @param {import("sequelize").Transaction} transaction 
 * @throws {AppError} If stock is insufficient
 */
ProductVariant.decrementStock = async function(variantId, quantity, transaction) {
  const [affectedCount] = await this.update(
    { quantity_in_stock: sequelize.literal(`quantity_in_stock - ${quantity}`) },
    {
      where: {
        id: variantId,
        quantity_in_stock: { [Op.gte]: quantity }
      },
      transaction
    }
  );

  if (affectedCount === 0) {
    throw new AppError("Insufficient stock.", 422);
  }
};

module.exports = { ProductVariant };
