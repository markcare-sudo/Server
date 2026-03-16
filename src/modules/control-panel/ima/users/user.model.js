/* modules/iam/users/user.model.js */

const { DataTypes } = require("sequelize");
const { sequelize } = require("../../../../config/db");

const User = sequelize.define(
  "User",
  {
    id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING(120), allowNull: false },
    email: { type: DataTypes.STRING(190), allowNull: false, unique: true },
    phone: { type: DataTypes.STRING(20), allowNull: true },
    password_hash: { type: DataTypes.STRING(255), allowNull: true },
    is_super_admin: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },

    is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  {
    tableName: "users",
    timestamps: true,
    underscored: true,
    paranoid: true,
    indexes: [{ fields: ["email"] }],
  }
);

module.exports = { User };