/**
 * @fileoverview Presentation logic (Controller) for Service Providers.
 */

const service = require("../services/serviceProviderService");
const asyncHandler = require("../utils/asyncHandler");
const { success } = require("../utils/apiResponse");
const AppError = require("../utils/AppError");
const { ServiceProvider } = require("../models/ServiceProvider");

/**
 * Registers a new service provider.
 */
const register = asyncHandler(async (req, res) => {
  const tenantId = req.tenantId; // Set by requireAuth
  const userId = req.user.id;    // Set by requireAuth
  const profileData = req.body;

  const data = await service.registerProvider(tenantId, userId, profileData);
  return success(res, data, "Service provider registered successfully", 201);
});

/**
 * Gets the authenticated provider's profile.
 */
const getMyProfile = asyncHandler(async (req, res) => {
  const tenantId = req.tenantId;
  const userId = req.user.id;
  
  const provider = await ServiceProvider.findOne({ 
    where: { user_id: userId, tenant_id: tenantId } 
  });
  
  if (!provider) {
    throw new AppError("Service provider profile not found.", 404);
  }

  return success(res, provider.toPublicJSON(), "Profile fetched successfully");
});

/**
 * Updates the provider's profile.
 */
const updateProfile = asyncHandler(async (req, res) => {
  const tenantId = req.tenantId;
  const userId = req.user.id;
  const updates = req.body;

  const provider = await ServiceProvider.findOne({ 
    where: { user_id: userId, tenant_id: tenantId } 
  });
  
  if (!provider) {
    throw new AppError("Service provider profile not found.", 404);
  }

  const data = await service.updateProfile(provider.id, tenantId, updates);
  return success(res, data, "Profile updated successfully");
});

/**
 * Sets the weekly availability.
 */
const setAvailability = asyncHandler(async (req, res) => {
  const tenantId = req.tenantId;
  const userId = req.user.id;
  const scheduleArray = Array.isArray(req.body) ? req.body : req.body.schedule;

  if (!scheduleArray) {
    throw new AppError("Valid schedule array is required.", 400);
  }

  const provider = await ServiceProvider.findOne({ 
    where: { user_id: userId, tenant_id: tenantId } 
  });
  
  if (!provider) {
    throw new AppError("Service provider profile not found.", 404);
  }

  const data = await service.setAvailability(provider.id, tenantId, scheduleArray);
  return success(res, data, "Availability updated successfully");
});

/**
 * Searches for nearby providers.
 */
const searchNearby = asyncHandler(async (req, res) => {
  const tenantId = req.tenantId;
  const { lat, lng, radius, category } = req.query;

  if (!lat || !lng) {
    throw new AppError("Latitude and Longitude query parameters are required.", 400);
  }

  const data = await service.searchNearby(
    tenantId, 
    parseFloat(lat), 
    parseFloat(lng), 
    parseFloat(radius || 10), 
    category
  );
  
  return success(res, data, "Providers fetched successfully");
});

/**
 * Verifies or rejects a provider.
 */
const verifyProvider = asyncHandler(async (req, res) => {
  const { providerId } = req.params;
  const { status } = req.body;

  const data = await service.verifyProvider(providerId, status);
  return success(res, data, `Provider marked as ${status}`);
});

module.exports = {
  register,
  getMyProfile,
  updateProfile,
  setAvailability,
  searchNearby,
  verifyProvider
};
