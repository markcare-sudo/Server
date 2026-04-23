/* modules/iam/roles/role.model.js */
const { sequelize } = require("../../../../config/db");
const { DataTypes } = require("sequelize");

const Role = sequelize.define(
  "Role",
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING(80), allowNull: false },
    code: { type: DataTypes.STRING(80), allowNull: false }, // e.g., LAB_TECH
    tenant_id: { type: DataTypes.BIGINT, allowNull: true },
    description: { type: DataTypes.STRING(255), allowNull: true },
    is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    created_by: { type: DataTypes.BIGINT, allowNull: true },
    updated_by: { type: DataTypes.BIGINT, allowNull: true },
  },
  {
    tableName: "roles",
    timestamps: true,
    underscored: true,
    paranoid: true,
    indexes: [{ unique: true, fields: ["code"] }],
  }
);

module.exports = { Role };
