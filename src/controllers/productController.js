/**
 * @fileoverview Presentation logic mapping direct catalog behaviors onto the Product endpoints.
 */

const service = require("../services/productService");
const asyncHandler = require("../utils/asyncHandler");
const { success, paginated } = require("../utils/apiResponse");
const { getPagination, getPaginationMeta } = require("../utils/pagination");
const AppError = require("../utils/AppError");

const createProduct = asyncHandler(async (req, res) => {
  const tenantId = req.tenantId; 
  const data = await service.createProduct(tenantId, req.body);
  return success(res, data, "Product created successfully", 201);
});

const updateProduct = asyncHandler(async (req, res) => {
  const tenantId = req.tenantId;
  const { id } = req.params;
  const data = await service.updateProduct(id, tenantId, req.body);
  return success(res, data, "Product updated successfully");
});

const listProducts = asyncHandler(async (req, res) => {
  const tenantId = req.tenantId || req.headers['x-tenant-id'];

  if (!tenantId) {
    throw new AppError("Tenant/Workspace context missing. Please provide x-tenant-id header.", 400);
  }

  const { category, search } = req.query;
  const { page, limit, offset } = getPagination(req.query);

  const { count, rows } = await service.listProducts(tenantId, { category, search, offset, limit });
  const paginationMeta = getPaginationMeta(count, page, limit);

  return paginated(res, rows, paginationMeta, "Products fetched successfully");
});

const getProductBySlug = asyncHandler(async (req, res) => {
  const tenantId = req.tenantId || req.headers['x-tenant-id']; 
  if (!tenantId) {
    throw new AppError("Tenant/Workspace context missing. Please provide x-tenant-id header.", 400);
  }

  const { slug } = req.params;
  const data = await service.getProductBySlug(tenantId, slug);
  return success(res, data, "Product fetched successfully");
});

const deleteProduct = asyncHandler(async (req, res) => {
  const tenantId = req.tenantId;
  const { id } = req.params;
  await service.deleteProduct(id, tenantId);
  return success(res, null, "Product deleted successfully");
});

module.exports = {
  createProduct,
  updateProduct,
  listProducts,
  getProductBySlug,
  deleteProduct
};
