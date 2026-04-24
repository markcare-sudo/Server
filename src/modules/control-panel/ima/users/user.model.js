/* modules/iam/users/user.model.js */

const { DataTypes } = require("sequelize");
const { sequelize } = require("../../../../config/db");

const User = sequelize.define(
  "User",
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING(120), allowNull: false },
    email: { type: DataTypes.STRING(190), allowNull: false },
    phone: { type: DataTypes.STRING(20), allowNull: true },
    user_type: { type: DataTypes.ENUM("PLATFORM", "CUSTOMER", "TECHNICIAN"), allowNull: false, defaultValue: "CUSTOMER" },
    password_hash: { type: DataTypes.STRING(255), allowNull: true },
    is_super_admin: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },

    // Verification Fields
    verification_token: { type: DataTypes.STRING(255), allowNull: true },
    verification_expires: { type: DataTypes.DATE, allowNull: true },

    is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    is_email_verified: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    is_phone_verified: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  },
  {
    tableName: "users",
    timestamps: true,
    underscored: true,
    paranoid: true,
    indexes: [{ fields: ["email"] }, { fields: ["verification_token"] }],
  }
);

module.exports = { User };