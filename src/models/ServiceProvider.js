const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const ServiceProvider = sequelize.define(
  "ServiceProvider",
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    tenant_id: { type: DataTypes.BIGINT, allowNull: false },
    user_id: { type: DataTypes.BIGINT, allowNull: false, unique: true },
    first_name: { type: DataTypes.STRING(100) },
    last_name: { type: DataTypes.STRING(100) },
    phone: { type: DataTypes.STRING(20) },
    email: { type: DataTypes.STRING(100) },
    category: { type: DataTypes.STRING(100) },
    skills: { type: DataTypes.TEXT },
    certifications: { type: DataTypes.TEXT },
    experience_years: { type: DataTypes.INTEGER },
    rating: { type: DataTypes.DECIMAL(3, 2), defaultValue: 0.00 },
    total_bookings: { type: DataTypes.INTEGER, defaultValue: 0 },
    active_status: {
      type: DataTypes.ENUM("ACTIVE", "INACTIVE", "BLOCKED"),
      defaultValue: "INACTIVE",
    },
    verification_status: {
      type: DataTypes.ENUM("PENDING", "VERIFIED", "REJECTED"),
      defaultValue: "PENDING",
    },
    kyc_details: { type: DataTypes.JSONB },
    bank_account: { type: DataTypes.JSONB },
    latitude: { type: DataTypes.DECIMAL(10, 8) },
    longitude: { type: DataTypes.DECIMAL(11, 8) },
    service_radius_km: { type: DataTypes.INTEGER, defaultValue: 10 },
  },
  {
    tableName: "service_providers",
    timestamps: true,
    underscored: true,
  }
);

/**
 * Find service providers within a given radius using Haversine formula.
 * @param {number|string} tenantId 
 * @param {number} lat 
 * @param {number} lng 
 * @param {number} radiusKm 
 * @returns {Promise<Array>}
 */
ServiceProvider.findNearby = async function (tenantId, lat, lng, radiusKm) {
  // Haversine formula in SQL
  const distanceCalc = `( 6371 * acos( cos( radians(${lat}) ) * cos( radians( latitude ) ) * cos( radians( longitude ) - radians(${lng}) ) + sin( radians(${lat}) ) * sin( radians( latitude ) ) ) )`;

  // We use sequelize.literal for selecting logic
  return await this.findAll({
    where: sequelize.and(
      { tenant_id: tenantId, active_status: 'ACTIVE' },
      sequelize.where(sequelize.literal(distanceCalc), '<=', radiusKm)
    ),
    attributes: {
      include: [
        [sequelize.literal(distanceCalc), 'distance_km']
      ]
    },
    order: sequelize.literal('distance_km ASC'),
  });
};

/**
 * Returns a public-safe presentation of the provider json.
 * @returns {Object}
 */
ServiceProvider.prototype.toPublicJSON = function () {
  const json = this.toJSON();
  // Strip sensitive info
  delete json.kyc_details;
  delete json.bank_account;
  return json;
};

module.exports = { ServiceProvider };
