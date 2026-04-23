const { DataTypes } = require("sequelize");
const { sequelize } = require("../../../../config/db");

const PlatformFeature = sequelize.define(
  "platform_features",
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    code: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    name: { type: DataTypes.STRING(150), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    module_id: { type: DataTypes.BIGINT, allowNull: false },
    is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    sort_order: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },

    created_by: { type: DataTypes.BIGINT, allowNull: true },
    updated_by: { type: DataTypes.BIGINT, allowNull: true },
  },
  {
    tableName: "platform_features",
    timestamps: true,
    paranoid: true,
    underscored: true,
    indexes: [
      { name: "idx_pf_module", fields: ["module_id"] },
    ],
  }
);

module.exports = PlatformFeature;
