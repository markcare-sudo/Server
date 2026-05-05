/* modules/iam/permissions/permission.model.js */
const { DataTypes } = require("sequelize");
const { sequelize } = require("../../../../config/db");

const Permission = sequelize.define(
  "Permission",
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    code: { type: DataTypes.STRING(150), allowNull: false, unique: true, comment: "Example: ECOM.ORDERS.READ", },
    scope: { type: DataTypes.ENUM("OWN", "ALL", "TEAM"), allowNull: false, defaultValue: "OWN", },
    module_id: { type: DataTypes.BIGINT, allowNull: false, references: { model: "modules", key: "id", }, },
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
    ],
  }
);

module.exports = { Permission };