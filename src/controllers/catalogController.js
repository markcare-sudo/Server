/**
 * @fileoverview Presentation logic for Service Catalog.
 */

const service = require("../services/catalogService");
const asyncHandler = require("../utils/asyncHandler");
const { success, paginated } = require("../utils/apiResponse");
const { getPagination, getPaginationMeta } = require("../utils/pagination");
const AppError = require("../utils/AppError");

/**
 * Creates a new service.
 */
const createService = asyncHandler(async (req, res) => {
  const tenantId = req.tenantId; 
  const data = await service.createService(tenantId, req.body);
  return success(res, data, "Service created successfully", 201);
});

/**
 * Updates a service.
 */
const updateService = asyncHandler(async (req, res) => {
  const tenantId = req.tenantId;
  const { id } = req.params;
  const data = await service.updateService(id, tenantId, req.body);
  return success(res, data, "Service updated successfully");
});

/**
 * Lists services.
 */
const listServices = asyncHandler(async (req, res) => {
  // Gracefully handle tenant resolution even for raw public API calls
  const tenantId = req.tenantId || req.headers['x-tenant-id'];

  if (!tenantId) {
    throw new AppError("Tenant/Workspace context missing. Please provide x-tenant-id header.", 400);
  }

  const { category, search } = req.query;
  const { page, limit, offset } = getPagination(req.query);

  const { count, rows } = await service.listServices(tenantId, { category, search, offset, limit });
  const paginationMeta = getPaginationMeta(count, page, limit);

  return paginated(res, rows, paginationMeta, "Services fetched successfully");
});

/**
 * Gets a service by slug.
 */
const getServiceBySlug = asyncHandler(async (req, res) => {
  const tenantId = req.tenantId || req.headers['x-tenant-id']; 
  if (!tenantId) {
    throw new AppError("Tenant/Workspace context missing. Please provide x-tenant-id header.", 400);
  }

  const { slug } = req.params;
  const data = await service.getServiceBySlug(tenantId, slug);
  return success(res, data, "Service fetched successfully");
});

/**
 * Disables a service (soft delete).
 */
const deleteService = asyncHandler(async (req, res) => {
  const tenantId = req.tenantId;
  const { id } = req.params;
  await service.deleteService(id, tenantId);
  return success(res, null, "Service deleted successfully");
});

module.exports = {
  createService,
  updateService,
  listServices,
  getServiceBySlug,
  deleteService
};
