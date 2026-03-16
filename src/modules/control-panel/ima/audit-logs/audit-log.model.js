const { DataTypes } = require("sequelize");
const { sequelize } = require("../../../../config/db");

const AuditLog = sequelize.define(
  "audit_logs",
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },

    tenant_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },

    user_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },

    action: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    module: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    entity_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },

    old_values: {
      type: DataTypes.JSON,
      allowNull: true,
    },

    new_values: {
      type: DataTypes.JSON,
      allowNull: true,
    },

    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    ip_address: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    user_agent: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "audit_logs",
    timestamps: false,
    underscored: true,
    paranoid: true,
  }
);

module.exports = AuditLog;