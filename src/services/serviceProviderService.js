/**
 * @fileoverview Business logic for Service Providers.
 */

const { sequelize } = require("../config/db");
const { ServiceProvider } = require("../models/ServiceProvider");
const { ServiceProviderAvailability } = require("../models/ServiceProviderAvailability");
const { log: auditLog } = require("../utils/auditLogger");
const AppError = require("../utils/AppError");

/**
 * Registers a new service provider.
 * @param {number|string} tenantId 
 * @param {number|string} userId 
 * @param {Object} profileData 
 * @returns {Promise<Object>}
 */
const registerProvider = async (tenantId, userId, profileData) => {
  // Check if user is already a provider
  const existing = await ServiceProvider.findOne({ where: { user_id: userId } });
  if (existing) {
    throw new AppError("User is already registered as a service provider.", 400);
  }

  try {
    const provider = await ServiceProvider.create({
      ...profileData,
      tenant_id: tenantId,
      user_id: userId,
      active_status: "INACTIVE",
      verification_status: "PENDING",
      rating: 0.0,
      total_bookings: 0
    });

    return provider.toPublicJSON();
  } catch (error) {
    throw new AppError(`Failed to register provider: ${error.message}`, 500);
  }
};

/**
 * Updates a service provider's profile.
 * @param {number|string} providerId 
 * @param {number|string} tenantId 
 * @param {Object} updates 
 * @returns {Promise<Object>}
 */
const updateProfile = async (providerId, tenantId, updates) => {
  const provider = await ServiceProvider.findOne({
    where: { id: providerId, tenant_id: tenantId }
  });

  if (!provider) {
    throw new AppError("Service provider not found.", 404);
  }

  // Prevent updates to restricted fields
  const allowedFields = [
    "first_name", "last_name", "phone", "category",
    "skills", "certifications", "experience_years",
    "latitude", "longitude", "service_radius_km"
  ];

  const safeUpdates = {};
  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      safeUpdates[field] = updates[field];
    }
  }

  // Validate coordinates
  if (safeUpdates.latitude !== undefined) {
    if (safeUpdates.latitude < -90 || safeUpdates.latitude > 90) {
      throw new AppError("Latitude must be between -90 and 90.", 400);
    }
  }
  if (safeUpdates.longitude !== undefined) {
    if (safeUpdates.longitude < -180 || safeUpdates.longitude > 180) {
      throw new AppError("Longitude must be between -180 and 180.", 400);
    }
  }

  try {
    await provider.update(safeUpdates);
    return provider.toPublicJSON();
  } catch (error) {
    throw new AppError(`Failed to update profile: ${error.message}`, 500);
  }
};

/**
 * Sets the weekly availability schedule for a provider.
 * @param {number|string} providerId 
 * @param {number|string} tenantId 
 * @param {Array<Object>} scheduleArray 
 * @returns {Promise<Array>}
 */
const setAvailability = async (providerId, tenantId, scheduleArray) => {
  const provider = await ServiceProvider.findOne({
    where: { id: providerId, tenant_id: tenantId }
  });

  if (!provider) {
    throw new AppError("Service provider not found.", 404);
  }

  const t = await sequelize.transaction();
  try {
    // Destroy all existing rows
    await ServiceProviderAvailability.destroy({
      where: { service_provider_id: providerId },
      transaction: t
    });

    // Remap payload to include providerId
    const newRecords = scheduleArray.map(schedule => ({
      ...schedule,
      service_provider_id: providerId
    }));

    await ServiceProviderAvailability.bulkCreate(newRecords, { transaction: t });
    await t.commit();

    return await ServiceProviderAvailability.getWeeklySchedule(providerId);
  } catch (error) {
    await t.rollback();
    throw new AppError(`Failed to set availability: ${error.message}`, 500);
  }
};

/**
 * Searches for nearby providers within a given radius.
 * @param {number|string} tenantId 
 * @param {number} lat 
 * @param {number} lng 
 * @param {number} radiusKm 
 * @param {string} [category] 
 * @returns {Promise<Array>}
 */
const searchNearby = async (tenantId, lat, lng, radiusKm, category) => {
  try {
    const providers = await ServiceProvider.findNearby(tenantId, lat, lng, radiusKm);

    // Filter by verification status, category
    const filtered = providers.filter(p => {
      if (p.verification_status !== "VERIFIED") return false;
      if (category && p.category !== category) return false;
      return true;
    });

    return filtered.map(p => {
      const json = p.toPublicJSON();
      json.distance_km = p.getDataValue('distance_km'); // Extract dynamic lit
      return json;
    });
  } catch (error) {
    throw new AppError(`Search failed: ${error.message}`, 500);
  }
};

/**
 * Verifies or rejects a provider (Admin only).
 * @param {number|string} providerId 
 * @param {string} status 'VERIFIED' or 'REJECTED'
 * @param {number|string} adminId 
 * @returns {Promise<Object>}
 */
const verifyProvider = async (providerId, status, adminId = null) => {
  if (!["VERIFIED", "REJECTED"].includes(status)) {
    throw new AppError("Invalid verification status.", 400);
  }

  const provider = await ServiceProvider.findByPk(providerId);
  if (!provider) {
    throw new AppError("Service provider not found.", 404);
  }

  try {
    provider.verification_status = status;
    if (status === "VERIFIED") {
      provider.active_status = "ACTIVE";
    }
    await provider.save();
    
    auditLog({
      userId: adminId,
      action: 'PROVIDER_VERIFIED',
      module: 'ServiceProvider',
      entityId: providerId,
      newValues: { status },
      tenantId: provider.tenant_id || null
    });

    return provider.toJSON(); // Returns full object since this is admin route context largely
  } catch (error) {
    throw new AppError(`Failed to verify provider: ${error.message}`, 500);
  }
};

module.exports = {
  registerProvider,
  updateProfile,
  setAvailability,
  searchNearby,
  verifyProvider
};
