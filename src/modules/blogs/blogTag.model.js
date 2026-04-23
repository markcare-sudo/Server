/* modules/blogs/blogTag.model.js */

const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/db");

const BlogTag = sequelize.define(
  "BlogTag",
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },

    blog_id: {
      type: DataTypes.BIGINT, allowNull: false, references: { model: "blogs", key: "id" },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },

    tag_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: "tags",
        key: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
  },
  {
    tableName: "blog_tags",
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ["blog_id", "tag_id"], // prevent duplicates
      },
      { fields: ["blog_id"] },
      { fields: ["tag_id"] },
    ],
  }
);

module.exports = { BlogTag };
