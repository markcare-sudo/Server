const { DataTypes } = require("sequelize");
const { sequelize } = require("../../../config/db");

const Address = sequelize.define("Address", {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    user_id: { type: DataTypes.BIGINT, allowNull: false },
    address_type: { type: DataTypes.ENUM("HOME", "OFFICE", "INDUSTRIAL"), defaultValue: "HOME" },
    street_address: { type: DataTypes.TEXT, allowNull: false },
    city: { type: DataTypes.STRING(100), allowNull: false },
    state: { type: DataTypes.STRING(100), allowNull: false },
    zip_code: { type: DataTypes.STRING(20), allowNull: false },
    is_default: { type: DataTypes.BOOLEAN, defaultValue: false }
}, {
    tableName: "addresses",
    underscored: true,
    timestamps: true,
});


module.exports = Address;