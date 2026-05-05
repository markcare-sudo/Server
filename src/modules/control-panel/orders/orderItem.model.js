const { DataTypes } = require("sequelize");
const { sequelize } = require("../../../config/db");


const OrderItem = sequelize.define("OrderItem", {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    order_id: { type: DataTypes.BIGINT, allowNull: false },
    product_id: { type: DataTypes.BIGINT, allowNull: false },
    variant_id: { type: DataTypes.BIGINT, allowNull: false }, // Specific item bought

    quantity: { type: DataTypes.INTEGER, allowNull: false },
    unit_price: { type: DataTypes.DECIMAL(12, 2), allowNull: false }, // Price at time of purchase
    subtotal: { type: DataTypes.DECIMAL(12, 2), allowNull: false }
}, {
    tableName: "order_items",
    underscored: true,
    timestamps: true,
    paranoid: true,
});

module.exports = OrderItem;