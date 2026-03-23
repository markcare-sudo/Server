const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const ServiceVariant = sequelize.define(
  "ServiceVariant",
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    service_id: { type: DataTypes.BIGINT, allowNull: false },
    name: { type: DataTypes.STRING(200), allowNull: false },
    description: { type: DataTypes.TEXT },
    duration_minutes: { type: DataTypes.INTEGER },
    price: { type: DataTypes.DECIMAL(10, 2) },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  {
    tableName: "service_variants",
    timestamps: true,
    underscored: true,
  }
);

module.exports = { ServiceVariant };
