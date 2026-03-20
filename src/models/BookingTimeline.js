const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const BookingTimeline = sequelize.define(
  "BookingTimeline",
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    booking_id: { type: DataTypes.BIGINT, allowNull: false },
    status: { type: DataTypes.STRING(50) },
    changed_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    changed_by: { type: DataTypes.BIGINT },
    notes: { type: DataTypes.TEXT },
  },
  {
    tableName: "booking_timeline",
    timestamps: false, // The migration doesn't specify created_at/updated_at, just changed_at
    underscored: true,
  }
);

module.exports = { BookingTimeline };
