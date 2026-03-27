/* modules/iam/permissions/permission.model.js */
const { DataTypes } = require("sequelize");
const { sequelize } = require("../../../../config/db");

const Permission = sequelize.define(
  "Permission",
  {
    id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    code: {
      type: DataTypes.STRING(150),
      allowNull: false,
      unique: true,
    },
    module_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      references: {
        model: "platform_modules",
        key: "id",
      },
    },
    feature_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true, // allow module-level permissions
      references: {
        model: "platform_features",
        key: "id",
      },
    },
    action: { type: DataTypes.STRING(40), allowNull: false }, // VIEW/CREATE/EDIT
    description: { type: DataTypes.STRING(255), allowNull: true },
  },
  {
    tableName: "permissions",
    timestamps: true,
    underscored: true,
    paranoid: true,
    indexes: [
      { unique: true, fields: ["code"] },
      { fields: ["module_id"] },
      { fields: ["feature_id"] },
    ],
  }
);

module.exports = { Permission };