/* modules/categories/category.model.js */

const { DataTypes } = require("sequelize");
const { sequelize } = require("../../../config/db");

const Category = sequelize.define(
    "Category",
    {
        id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
        name: { type: DataTypes.STRING(150), allowNull: false, unique: true },
        slug: { type: DataTypes.STRING(150), allowNull: false, unique: true },
        description: { type: DataTypes.TEXT, allowNull: true },
        image_url: { type: DataTypes.STRING(255), allowNull: true },
        parent_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
        is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
    },
    {
        tableName: "categories",
        timestamps: true,
        underscored: true,
    }
);

module.exports = { Category };