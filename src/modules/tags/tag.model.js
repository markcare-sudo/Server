/* modules/tags/tag.model.js */

const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/db");

const Tag = sequelize.define(
  "Tag",
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING(120), allowNull: false, unique: true },

    slug: { type: DataTypes.STRING(150), allowNull: false, unique: true },
    is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  {
    tableName: "tags",
    timestamps: true,
    underscored: true,
    paranoid: true,
    indexes: [
      { fields: ["slug"] },
      { fields: ["name"] },
    ],
  }
);

module.exports = { Tag };
