// src/modules/.../masters/masters.model.js
const { DataTypes } = require("sequelize");
const { sequelize } = require("../../../config/db");

const Master = sequelize.define(
  "Master",
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },

    tenantId: { type: DataTypes.BIGINT, allowNull: false },

    // e.g. "DEPARTMENT", "TEST_CATEGORY", "SAMPLE_TYPE"
    type: { type: DataTypes.STRING(60), allowNull: false },

    // e.g. "BIOCHEM", "HEMATO", "SERUM"
    code: { type: DataTypes.STRING(60), allowNull: false },

    // display name
    name: { type: DataTypes.STRING(150), allowNull: false },

    // optional payload (price, unit, metadata, etc.)
    value: { type: DataTypes.JSON, allowNull: true },

    isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },

    deletedAt: { type: DataTypes.DATE, allowNull: true },
    deletedBy: { type: DataTypes.BIGINT, allowNull: true },
  },
  {
    tableName: "masters",
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ["tenant_id"] },
      { fields: ["tenant_id", "type"] },
      { fields: ["tenant_id", "type", "is_active"] },
      { fields: ["tenant_id", "type", "code"], unique: true, name: "uniq_master_per_tenant_type_code" },
    ],
  }
);

module.exports = { Master };
