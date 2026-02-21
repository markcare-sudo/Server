/* modules/media/media.model.js */

const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/db");

const Media = sequelize.define(
  "Media",
  {
    id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },

    url: { type: DataTypes.STRING(1000), allowNull: false },

    public_id: { type: DataTypes.STRING(255), allowNull: false },

    type: { 
      type: DataTypes.ENUM("image", "video", "document"),
      allowNull: false 
    },

    mime_type: { type: DataTypes.STRING(120), allowNull: true },
    size: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },

    alt_text: { type: DataTypes.STRING(255), allowNull: true }, // SEO
    caption: { type: DataTypes.STRING(500), allowNull: true },

    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  {
    tableName: "media",
    timestamps: true,
    underscored: true,
  }
);

module.exports = { Media };