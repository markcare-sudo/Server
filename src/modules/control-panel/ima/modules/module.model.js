const { DataTypes } = require("sequelize");
const { sequelize } = require("../../../../config/db");

const Module = sequelize.define("modules", {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },

    name: { type: DataTypes.STRING(150), allowNull: false },
    code: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    parent_id: { type: DataTypes.BIGINT, allowNull: true, },
    path: { type: DataTypes.STRING(255), allowNull: true }, // route
    icon: { type: DataTypes.STRING(100), allowNull: true },

    // 🔥 KEY FIELDS (Zoho style)
    navigation_type: { type: DataTypes.ENUM("SIDEBAR", "TOPBAR", "HIDDEN"), defaultValue: "SIDEBAR", },
    is_clickable: { type: DataTypes.BOOLEAN, defaultValue: true, }, // false = only group
    is_visible: { type: DataTypes.BOOLEAN, defaultValue: true, },
    sort_order: { type: DataTypes.INTEGER, defaultValue: 0 },

    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },

}, {
    tableName: "modules",
    timestamps: true,
    paranoid: true,
    underscored: true,
    indexes: [
        { unique: true, fields: ["code", "deleted_at"] },
        { fields: ["is_active"] },
        { fields: ["sort_order"] },
    ],
});

module.exports = Module;
