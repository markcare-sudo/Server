const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const Service = sequelize.define(
  "Service",
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    tenant_id: { type: DataTypes.BIGINT, allowNull: false },
    name: { type: DataTypes.STRING(200), allowNull: false },
    slug: { type: DataTypes.STRING(200), allowNull: false, unique: true },
    description: { type: DataTypes.TEXT },
    category: { type: DataTypes.STRING(100) },
    base_price: { type: DataTypes.DECIMAL(10, 2) },
    featured_image: { type: DataTypes.STRING(500) },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  {
    tableName: "services",
    timestamps: true,
    underscored: true,
    defaultScope: {
      where: {
        is_active: true,
      },
    },
    hooks: {
      beforeCreate: (service, options) => {
        if (!service.slug && service.name) {
          service.slug =
            service.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") +
            "-" +
            Date.now();
        }
      },
    },
  }
);

module.exports = { Service };
