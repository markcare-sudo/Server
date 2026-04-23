const { DataTypes } = require("sequelize");
const { sequelize } = require("../../../config/db");

/**
 * SERVICE_BOOKING: The actual appointment/job card
 */
const ServiceBooking = sequelize.define("ServiceBooking", {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },

    // Links
    service_id: { type: DataTypes.BIGINT, allowNull: false },
    user_id: { type: DataTypes.BIGINT, allowNull: false },
    order_id: { type: DataTypes.BIGINT, allowNull: true }, // Links to payment/transaction

    // Status Tracking
    status: {
        type: DataTypes.ENUM("PENDING", "ASSIGNED", "IN_PROGRESS", "COMPLETED", "CANCELLED"),
        defaultValue: "PENDING"
    },

    // Appointment Logistics
    scheduled_date: { type: DataTypes.DATEONLY, allowNull: false },
    time_slot: { type: DataTypes.STRING(50) }, // e.g., "10:00 AM - 12:00 PM"

    // Resource Assignment
    technician_id: { type: DataTypes.BIGINT, allowNull: true },

    // Asset Context (Since no cart, we capture what is being serviced here)
    asset_info: {
        type: DataTypes.JSONB,
        defaultValue: {},
        comment: "Stores Brand, Model, Serial No, or Address of the machine"
    },

    // Completion Details
    started_at: { type: DataTypes.DATE },
    completed_at: { type: DataTypes.DATE },
    completion_otp: { type: DataTypes.STRING(6) },
    technician_notes: { type: DataTypes.TEXT }

}, {
    tableName: "service_bookings",
    timestamps: true,
    underscored: true,
    paranoid: true,
    indexes: [
        { fields: ["status"] },
        { fields: ["scheduled_date"] },
        { fields: ["technician_id"] }
    ]
});

module.exports = ServiceBooking;