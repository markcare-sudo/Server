const { DataTypes } = require("sequelize");
const { sequelize } = require("../../../config/db");

const Brand = sequelize.define("Brand", {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    slug: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    image_url: { type: DataTypes.STRING(255) },
    description: { type: DataTypes.TEXT },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
}, {
    tableName: "brands",
    timestamps: true,
    underscored: true
});

module.exports = { Brand };