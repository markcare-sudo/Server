// src/modules/iam/tenantUsers/tenantUser.model.js

const { DataTypes } = require("sequelize");
const { sequelize } = require("../../../../config/db");

const TenantUser = sequelize.define(
  "tenant_users",
  {
    id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    tenant_role_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  {
    tableName: "tenant_users",
    timestamps: true,
    underscored: true,
    paranoid: true,
    indexes: [
      {
        unique: true,
        fields: ["user_id", "tenant_role_id"], // prevent duplicate membership
      },
    ],
  }
);

module.exports = TenantUser;
