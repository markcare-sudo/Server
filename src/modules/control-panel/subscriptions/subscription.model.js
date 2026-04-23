const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/db");

const MaintenancePlan = sequelize.define("MaintenancePlan", {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING(150), allowNull: false },
    description: { type: DataTypes.TEXT },
    plan_type: { type: DataTypes.ENUM("AMC", "OMC"), allowNull: false },
    price: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    duration_months: { type: DataTypes.INTEGER, defaultValue: 12 },
    visits_allowed: { type: DataTypes.INTEGER, defaultValue: 4 }, // Number of service visits
}, {
    tableName: "maintenance_plans",
    underscored: true,
    timestamps: true,
});

const Subscription = sequelize.define("Subscription", {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    user_id: { type: DataTypes.BIGINT, allowNull: false },
    plan_id: { type: DataTypes.BIGINT, allowNull: false },

    start_date: { type: DataTypes.DATEONLY, allowNull: false },
    end_date: { type: DataTypes.DATEONLY, allowNull: false },
    status: { type: DataTypes.ENUM("ACTIVE", "EXPIRED", "CANCELLED"), defaultValue: "ACTIVE" },
    auto_renew: { type: DataTypes.BOOLEAN, defaultValue: false }
}, {
    tableName: "subscriptions",
    timestamps: true,
    underscored: true
});

module.exports = { MaintenancePlan, Subscription };