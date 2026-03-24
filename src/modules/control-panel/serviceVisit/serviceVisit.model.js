const { DataTypes } = require("sequelize");
const { sequelize } = require("../../../config/db");

/**
 * SERVICE_VISIT: Tracks each individual technician visit
 * Linked to either a one-time Order or a recurring Subscription
 */
const ServiceVisit = sequelize.define("ServiceVisit", {
    id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },

    // Links (Polymorphic-like behavior)
    subscription_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true }, // For AMC/OMC
    order_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },        // For one-time repairs

    technician_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
    user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false }, // Customer
    address_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },

    scheduled_date: { type: DataTypes.DATEONLY, allowNull: false },
    scheduled_slot: { type: DataTypes.STRING(50) }, // e.g., "10:00 AM - 01:00 PM"

    status: {
        type: DataTypes.ENUM("SCHEDULED", "ON_THE_WAY", "IN_PROGRESS", "COMPLETED", "CANCELLED"),
        defaultValue: "SCHEDULED"
    },

    service_notes: { type: DataTypes.TEXT }, // What the technician did
    customer_feedback: { type: DataTypes.TEXT },
    rating: { type: DataTypes.INTEGER, validate: { min: 1, max: 5 } },

    // Proof of service
    completion_image_url: { type: DataTypes.STRING(255) },
    otp_verified: { type: DataTypes.BOOLEAN, defaultValue: false }
}, {
    tableName: "service_visits",
    timestamps: true,
    underscored: true
});

module.exports = { ServiceVisit };