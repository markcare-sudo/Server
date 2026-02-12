/* modules/iam/permissions/permission.model.js */
// const { sequelize } = require("../../../config/db");
const { DataTypes } = require("sequelize");
const { sequelize } = require("../../../../config/db");

const Permission = sequelize.define(
  "Permission",
  {
    id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    key: { type: DataTypes.STRING(120), allowNull: false, unique: true }, // LIS.PATIENTS.VIEW
    module: { type: DataTypes.STRING(60), allowNull: false }, // LIS, ADMIN
    page: { type: DataTypes.STRING(60), allowNull: true },   // PATIENTS
    action: { type: DataTypes.STRING(40), allowNull: false }, // VIEW/CREATE/EDIT
    description: { type: DataTypes.STRING(255), allowNull: true },
  },
  {
    tableName: "permissions",
    timestamps: true,
    underscored: true,
    paranoid: true
  }
);

module.exports = { Permission };