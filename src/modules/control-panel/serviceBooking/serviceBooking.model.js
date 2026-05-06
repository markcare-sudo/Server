const { DataTypes } = require("sequelize");
const { sequelize } = require("../../../config/db");

const ServiceBooking = sequelize.define("ServiceBooking", {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },

    // 🔗 Links
    service_id: { type: DataTypes.BIGINT, allowNull: false },
    address_id: { type: DataTypes.BIGINT, allowNull: false },
    user_id: { type: DataTypes.BIGINT, allowNull: false },
    booking_code: { type: DataTypes.STRING(50), unique: true },

    // 💳 Payment
    payment_method: { type: DataTypes.ENUM("ONLINE", "COD"), allowNull: false },
    payment_status: { type: DataTypes.ENUM("PENDING", "PAID", "FAILED", "UNPAID"), defaultValue: "UNPAID" },
    transaction_id: { type: DataTypes.STRING(255) },

    // 📦 Booking lifecycle (JOB FLOW)
    status: { type: DataTypes.ENUM("PENDING", "CONFIRMED", "ASSIGNED", "IN_PROGRESS", "COMPLETED", "CANCELLED"), defaultValue: "PENDING" },

    // 📅 Appointment
    scheduled_date: { type: DataTypes.DATEONLY, allowNull: false },
    time_slot: { type: DataTypes.STRING(50) },

    // 👨‍🔧 Technician
    technician_id: { type: DataTypes.BIGINT, allowNull: true },

    // 🧾 Asset Info
    asset_info: { type: DataTypes.JSONB, defaultValue: {}, comment: "Brand, Model, Serial No, etc." },

    // ⏱️ Timeline
    started_at: { type: DataTypes.DATE },
    completed_at: { type: DataTypes.DATE },

    // 🔐 Completion security
    completion_otp: { type: DataTypes.STRING(6) },

    // 📝 Notes
    technician_notes: { type: DataTypes.TEXT },

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