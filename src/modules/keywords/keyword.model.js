/* modules/keywords/keyword.model.js */

const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/db");

const Keyword = sequelize.define(
  "Keyword",
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },

    keyword: { type: DataTypes.STRING(150), allowNull: false, unique: true },

    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  {
    tableName: "keywords",
    timestamps: true,
    underscored: true,
  }
);

module.exports = { Keyword };