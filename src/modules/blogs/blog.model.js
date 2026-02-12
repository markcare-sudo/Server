/* modules/blogs/blog.model.js */

const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/db");

const Blog = sequelize.define(
  "Blog",
  {
    id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    title: { type: DataTypes.STRING(255), allowNull: false },
    slug: { type: DataTypes.STRING(255), allowNull: false, unique: true },

    excerpt: { type: DataTypes.TEXT, allowNull: true },
    content: { type: DataTypes.TEXT("long"), allowNull: false },

    featured_image: { type: DataTypes.STRING(500), allowNull: true },

    category: { type: DataTypes.STRING(120), allowNull: true },
    status: { type: DataTypes.ENUM("draft", "published", "archived"), allowNull: false, defaultValue: "draft" },
    view_count: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
    
    seo_title: { type: DataTypes.STRING(255), allowNull: true },
    seo_description: { type: DataTypes.STRING(500), allowNull: true },

    published_at: { type: DataTypes.DATE, allowNull: true },
    author_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  {
    tableName: "blogs",
    timestamps: true,
    underscored: true,
    paranoid: true,
    indexes: [
      { fields: ["slug"] },
      { fields: ["status"] },
      { fields: ["author_id"] },
      { fields: ["published_at"] },
    ],
  }
);

module.exports = { Blog };
