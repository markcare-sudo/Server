const { DataTypes } = require("sequelize");
const { sequelize } = require("../../../config/db");

const Address = sequelize.define("Address", {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    user_id: { type: DataTypes.BIGINT, allowNull: false },
    full_name: { type: DataTypes.STRING(255), allowNull: false, },
    phone: {
        type: DataTypes.STRING(20),
        allowNull: false,
        validate: {
            is: /^[0-9+() -]+$/i,
        },
    },
    address: { type: DataTypes.TEXT, allowNull: false },
    latitude: { type: DataTypes.DECIMAL(10, 8), allowNull: true, },
    longitude: { type: DataTypes.DECIMAL(11, 8), allowNull: true, },
    address_type: { type: DataTypes.ENUM("HOME", "WORK", "OTHER"), allowNull: false, defaultValue: "HOME", },
    city: { type: DataTypes.STRING(100), allowNull: false },
    state: { type: DataTypes.STRING(100), allowNull: false },
    locality: { type: DataTypes.STRING(255), allowNull: false, comment: "Area, Sector, or Colony", },
    pincode: { type: DataTypes.STRING(20), allowNull: false },
    is_default: { type: DataTypes.BOOLEAN, defaultValue: false }
}, {
    tableName: "addresses",
    underscored: true,
    timestamps: true,
});


module.exports = Address;