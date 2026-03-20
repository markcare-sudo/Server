const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const ServiceProviderAvailability = sequelize.define(
  "ServiceProviderAvailability",
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    service_provider_id: { type: DataTypes.BIGINT, allowNull: false },
    day_of_week: { type: DataTypes.INTEGER, allowNull: false },
    start_time: { type: DataTypes.TIME, allowNull: false },
    end_time: { type: DataTypes.TIME, allowNull: false },
    break_start: { type: DataTypes.TIME },
    break_end: { type: DataTypes.TIME },
    is_available: { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  {
    tableName: "service_provider_availability",
    timestamps: true,
    underscored: true,
  }
);

/**
 * Returns a complete 7-day schedule sorted Mon-Sun.
 * Missing days are returned as is_available: false
 * @param {number|string} providerId
 * @returns {Promise<Array>}
 */
ServiceProviderAvailability.getWeeklySchedule = async function (providerId) {
  const records = await this.findAll({
    where: { service_provider_id: providerId },
  });

  const scheduleMap = new Map();
  records.forEach((r) => scheduleMap.set(r.day_of_week, r.toJSON()));

  // Force sort: Monday (1) to Sunday (0)
  const order = [1, 2, 3, 4, 5, 6, 0];
  const fullSchedule = order.map((dayOffset) => {
    if (scheduleMap.has(dayOffset)) {
      return scheduleMap.get(dayOffset);
    }
    // Fill missing days
    return {
      service_provider_id: providerId,
      day_of_week: dayOffset,
      start_time: null,
      end_time: null,
      break_start: null,
      break_end: null,
      is_available: false,
    };
  });

  return fullSchedule;
};

module.exports = { ServiceProviderAvailability };
