/* modules/blogs/blogKeyword.model.js */
const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/db");

const BlogKeyword = sequelize.define("BlogKeyword", {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    blog_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: { model: "blogs", key: "id" }
    },
    keyword_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: { model: "keywords", key: "id" }
    }
}, {
    tableName: "blog_keywords",
    underscored: true,
    timestamps: true
});

module.exports = { BlogKeyword };