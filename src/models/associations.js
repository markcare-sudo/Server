// src/models/associations.js

module.exports = () => {
  const { Blog } = require("../modules/blogs/blog.model");
  const { Tag } = require("../modules/tags/tag.model");
  const { Keyword } = require("../modules/keywords/keyword.model");

  /* =========================================================
     BLOG ↔ TAG (Many-to-Many)
  ========================================================= */

  Blog.belongsToMany(Tag, {
    through: "blog_tags",
    foreignKey: "blog_id",
    otherKey: "tag_id",
  });

  Tag.belongsToMany(Blog, {
    through: "blog_tags",
    foreignKey: "tag_id",
    otherKey: "blog_id",
  });

  /* =========================================================
     BLOG ↔ KEYWORD (Many-to-Many)
  ========================================================= */

  Blog.belongsToMany(Keyword, {
    through: "blog_keywords",
    foreignKey: "blog_id",
    otherKey: "keyword_id",
  });

  Keyword.belongsToMany(Blog, {
    through: "blog_keywords",
    foreignKey: "keyword_id",
    otherKey: "blog_id",
  });

  console.log("✅ Model associations initialized");
};