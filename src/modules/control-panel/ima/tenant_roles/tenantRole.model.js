// src/modules/iam/tenantRoles/tenantRole.model.js

const { DataTypes } = require("sequelize");
const { sequelize } = require("../../../../config/db");

const TenantRole = sequelize.define(
  "tenant_roles",
  {
    id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    tenant_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    role_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
  },
  {
    tableName: "tenant_roles",
    timestamps: true,
    underscored: true,
    paranoid: true,
    indexes: [
      {
        unique: true,
        fields: ["tenant_id", "role_id"], // prevent duplicate role in same tenant
      },
    ],
  }
);

module.exports = TenantRole;
