const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const Booking = sequelize.define(
  "Booking",
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    tenant_id: { type: DataTypes.BIGINT, allowNull: false },
    customer_id: { type: DataTypes.BIGINT, allowNull: false },
    service_id: { type: DataTypes.BIGINT, allowNull: false },
    service_variant_id: { type: DataTypes.BIGINT },
    service_provider_id: { type: DataTypes.BIGINT },
    booking_datetime: { type: DataTypes.DATE, allowNull: false },
    service_address: { type: DataTypes.TEXT },
    service_latitude: { type: DataTypes.DECIMAL(10, 8) },
    service_longitude: { type: DataTypes.DECIMAL(11, 8) },
    status: {
      type: DataTypes.ENUM("PENDING", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "NO_SHOW"),
      defaultValue: "PENDING",
    },
    base_price: { type: DataTypes.DECIMAL(10, 2) },
    discount_amount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    final_price: { type: DataTypes.DECIMAL(10, 2) },
    payment_method: { type: DataTypes.STRING(50) },
    payment_status: {
      type: DataTypes.ENUM("PENDING", "COMPLETED", "FAILED", "REFUNDED"),
      defaultValue: "PENDING",
    },
    cancellation_reason: { type: DataTypes.STRING(500) },
    cancelled_by: { type: DataTypes.ENUM("CUSTOMER", "PROFESSIONAL", "ADMIN") },
    refund_amount: { type: DataTypes.DECIMAL(10, 2) },
    notes: { type: DataTypes.TEXT },
  },
  {
    tableName: "bookings",
    timestamps: true,
    underscored: true,
    hooks: {
      afterCreate: async (booking, options) => {
        if (!sequelize.models.BookingTimeline) return;
        await sequelize.models.BookingTimeline.create(
          {
            booking_id: booking.id,
            status: booking.status || "PENDING",
            changed_by: options.userId || null, 
          },
          { transaction: options.transaction }
        );
      },
      afterUpdate: async (booking, options) => {
        if (booking.changed("status")) {
          if (!sequelize.models.BookingTimeline) return;
          await sequelize.models.BookingTimeline.create(
            {
              booking_id: booking.id,
              status: booking.status,
              changed_by: options.userId || null,
            },
            { transaction: options.transaction }
          );
        }
      },
    },
  }
);

/**
 * Determines if a user can cancel this booking.
 * @param {number|string} userId 
 * @param {string} userRole "CUSTOMER", "PROFESSIONAL", or "ADMIN"
 * @returns {Object} { allowed: boolean, reason: string }
 */
Booking.prototype.canBeCancelledBy = function (userId, userRole) {
  if (userRole === "CUSTOMER") {
    // Determine ownership
    if (this.customer_id.toString() !== userId.toString()) {
      return { allowed: false, reason: "You are not the owner of this booking." };
    }
    // Check state
    if (!["PENDING", "CONFIRMED"].includes(this.status)) {
      return { allowed: false, reason: `Cannot cancel a booking that is ${this.status}.` };
    }
    return { allowed: true, reason: "" };
  }

  if (["PROFESSIONAL", "ADMIN"].includes(userRole)) {
    // Check ownership if professional
    if (userRole === "PROFESSIONAL" && this.service_provider_id?.toString() !== userId.toString()) {
      return { allowed: false, reason: "You are not assigned to this booking." };
    }
    // Check state
    if (["COMPLETED", "CANCELLED"].includes(this.status)) {
      return { allowed: false, reason: `Booking is already ${this.status}.` };
    }
    return { allowed: true, reason: "" };
  }

  return { allowed: false, reason: "Unknown role." };
};

module.exports = { Booking };
