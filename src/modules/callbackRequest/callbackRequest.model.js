/* modules/enquiry/callback-request.model.js */

const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/db");

const CallbackRequest = sequelize.define(
  "CallbackRequest",
  {
    id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    product_name: { type: DataTypes.STRING(200), allowNull: true },
    product_price: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    phone: { type: DataTypes.STRING(20), allowNull: false },
    email: { type: DataTypes.STRING(190), allowNull: false },
    status: { type: DataTypes.ENUM("NEW", "CONTACTED", "CLOSED"), allowNull: false, defaultValue: "NEW" },
    source: { type: DataTypes.ENUM("WEBSITE", "WHATSAPP", "PHONE"), allowNull: false, defaultValue: "WEBSITE" },
    is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  {
    tableName: "callback_requests",
    timestamps: true,
    underscored: true,
    paranoid: true,
    indexes: [{ fields: ["phone"] }, { fields: ["email"] }, { fields: ["status"] }],
  }
);

module.exports = { CallbackRequest };