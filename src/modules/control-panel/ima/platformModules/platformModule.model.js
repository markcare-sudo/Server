const { DataTypes } = require("sequelize");
const { sequelize } = require("../../../../config/db");

const PlatformModule = sequelize.define("platform_modules", {
  id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },

  code: { type: DataTypes.STRING(100), allowNull: false, unique: true }, // BILLING, REPORTS, PATIENTS
  name: { type: DataTypes.STRING(150), allowNull: false, },
  description: { type: DataTypes.TEXT, allowNull: true },
  path: { type: DataTypes.TEXT, allowNull: true, unique: true },

  has_features: { type: DataTypes.BOOLEAN, defaultValue: true },

  created_by: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
  updated_by: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },

  sort_order: { type: DataTypes.INTEGER, defaultValue: 0 },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },

}, {
  tableName: "platform_modules",
  timestamps: true,
  paranoid: true,
  underscored: true,
  indexes: [
    { unique: true, fields: ["code", "deleted_at"] },
    { fields: ["is_active"] },
    { fields: ["sort_order"] },
  ],
});

module.exports = PlatformModule;
