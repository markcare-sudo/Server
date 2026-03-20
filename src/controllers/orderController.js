/**
 * @fileoverview Presentation logic wrapping Order fulfillment actions handling checkout flows organically.
 */

const orderService = require("../services/orderService");
const asyncHandler = require("../utils/asyncHandler");
const { success, paginated } = require("../utils/apiResponse");
const { getPagination, getPaginationMeta } = require("../utils/pagination");
const AppError = require("../utils/AppError");

exports.createOrder = asyncHandler(async (req, res) => {
  const tenantId = req.tenantId;
  const customerId = req.user.id;
  
  const order = await orderService.createOrder(tenantId, customerId, req.body);
  return success(res, order, "Order placed successfully", 201);
});

exports.listOrders = asyncHandler(async (req, res) => {
  const tenantId = req.tenantId;
  const { status } = req.query;
  const { page, limit, offset } = getPagination(req.query);
  
  // Security isolation depending on role
  const isAdmin = req.user.role === "ADMIN" || req.user.roles?.includes("ADMIN");
  const filters = { order_status: status, offset, limit };
  
  if (!isAdmin) {
    // Standard customers can only explicitly query internally scoped bookings mapping securely to req.user.id
    filters.customerId = req.user.id;
  }

  const { count, rows } = await orderService.listOrders(tenantId, filters);
  const paginationMeta = getPaginationMeta(count, page, limit);

  return paginated(res, rows, paginationMeta, "Orders fetched successfully");
});

exports.getOrderById = asyncHandler(async (req, res) => {
  const tenantId = req.tenantId;
  const { id } = req.params;
  const order = await orderService.getOrderById(id, tenantId);

  const isAdmin = req.user.role === "ADMIN" || req.user.roles?.includes("ADMIN");
  if (!isAdmin && order.customer_id.toString() !== req.user.id.toString()) {
    throw new AppError("You do not have permission to view this order.", 403);
  }

  return success(res, order, "Order fetched successfully");
});

exports.updateStatus = asyncHandler(async (req, res) => {
  const tenantId = req.tenantId;
  const { id } = req.params;
  const { order_status } = req.body; 
  const adminId = req.user.id;

  const order = await orderService.updateOrderStatus(id, tenantId, order_status, adminId);
  return success(res, order, "Order status updated successfully");
});

exports.cancelOrder = asyncHandler(async (req, res) => {
  const tenantId = req.tenantId;
  const { id } = req.params;
  
  // Hand off internal role check logically handling if an Admin runs cancelOrder versus User
  const isAdmin = req.user.role === "ADMIN" || req.user.roles?.includes("ADMIN");
  const customerId = isAdmin ? null : req.user.id;

  const result = await orderService.cancelOrder(id, tenantId, customerId);
  return success(res, result, "Order cancelled successfully");
});
