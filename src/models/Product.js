const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const Product = sequelize.define(
  "Product",
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    tenant_id: { type: DataTypes.BIGINT, allowNull: false },
    name: { type: DataTypes.STRING(200), allowNull: false },
    slug: { type: DataTypes.STRING(200), unique: true },
    description: { type: DataTypes.TEXT },
    category: { type: DataTypes.STRING(100) },
    featured_image: { type: DataTypes.STRING(500) },
    price: { type: DataTypes.DECIMAL(10, 2) },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  {
    tableName: "products",
    timestamps: true,
    underscored: true,
    defaultScope: {
      where: {
        is_active: true,
      },
    },
    hooks: {
      beforeCreate: (product, options) => {
        if (!product.slug && product.name) {
          product.slug =
            product.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") +
            "-" +
            Date.now();
        }
      },
    },
  }
);

/**
 * Returns a sanitized representation omitting any private mapping flags if attached in the future.
 */
Product.prototype.toPublicJSON = function () {
  const data = this.toJSON();
  // Safe filtering logic mirroring user specifications
  // No strict private fields currently persist inside products explicitly, 
  // but it forms a rigid structural layer for expansion.
  return data;
};

module.exports = { Product };
