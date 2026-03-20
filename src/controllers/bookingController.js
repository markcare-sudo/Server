/**
 * @fileoverview Presentation Logic for Bookings
 */

const bookingService = require("../services/bookingService");
const asyncHandler = require("../utils/asyncHandler");
const { success, paginated } = require("../utils/apiResponse");
const { getPagination, getPaginationMeta } = require("../utils/pagination");
const AppError = require("../utils/AppError");
const { ServiceProvider } = require("../models/ServiceProvider");

exports.createBooking = asyncHandler(async (req, res) => {
  const tenantId = req.tenantId;
  const customerId = req.user.id;
  
  const booking = await bookingService.createBooking(tenantId, customerId, req.body);
  return success(res, booking, "Booking created successfully", 201);
});

exports.getMyBookings = asyncHandler(async (req, res) => {
  const tenantId = req.tenantId;
  const customerId = req.user.id;
  const { status, dateFrom, dateTo } = req.query;
  const { page, limit, offset } = getPagination(req.query);

  const filters = { customerId, status, dateFrom, dateTo, offset, limit };
  const { count, rows } = await bookingService.listBookings(tenantId, filters);
  const paginationMeta = getPaginationMeta(count, page, limit);

  return paginated(res, rows, paginationMeta, "My bookings fetched successfully");
});

exports.getProviderBookings = asyncHandler(async (req, res) => {
  const tenantId = req.tenantId;

  // The caller is acting as a service provider; fetch their literal provider record
  const provider = await ServiceProvider.findOne({ where: { user_id: req.user.id, tenant_id: tenantId } });
  
  if (!provider) {
    throw new AppError("You are not registered as a service provider.", 403);
  }

  const { status, dateFrom, dateTo } = req.query;
  const { page, limit, offset } = getPagination(req.query);

  const filters = { providerId: provider.id, status, dateFrom, dateTo, offset, limit };
  const { count, rows } = await bookingService.listBookings(tenantId, filters);
  const paginationMeta = getPaginationMeta(count, page, limit);

  return paginated(res, rows, paginationMeta, "Provider bookings fetched successfully");
});

exports.getBookingById = asyncHandler(async (req, res) => {
  const tenantId = req.tenantId;
  const { id } = req.params;
  const booking = await bookingService.getBookingById(id, tenantId);

  // Deep Security Gating: Only Admins or participants can view it
  const isAdmin = req.user.role === "ADMIN" || req.user.roles?.includes("ADMIN");
  let isParticipant = false;

  if (booking.customer_id.toString() === req.user.id.toString()) {
    isParticipant = true;
  } else if (booking.provider && booking.provider.user_id.toString() === req.user.id.toString()) {
    isParticipant = true;
  }

  if (!isAdmin && !isParticipant) {
    throw new AppError("You do not have permission to view this booking.", 403);
  }

  return success(res, booking, "Booking fetched successfully");
});

exports.updateStatus = asyncHandler(async (req, res) => {
  const tenantId = req.tenantId;
  const { id } = req.params;
  const { status, notes } = req.body;
  const changedByUserId = req.user.id;

  const isAdmin = req.user.role === "ADMIN" || req.user.roles?.includes("ADMIN");
  
  // If not admin, verify they actually own the booking as a Provider natively
  if (!isAdmin) {
      const booking = await bookingService.getBookingById(id, tenantId);
      if (!booking.provider || booking.provider.user_id.toString() !== req.user.id.toString()) {
         throw new AppError("Only the assigned provider or an admin can update status.", 403);
      }
  }

  const updatedBooking = await bookingService.updateBookingStatus(id, tenantId, status, changedByUserId, notes);
  return success(res, updatedBooking, "Booking status updated successfully");
});

exports.cancelBooking = asyncHandler(async (req, res) => {
  const tenantId = req.tenantId;
  const { id } = req.params;
  const { reason } = req.body;
  const cancelledByUserId = req.user.id;
  
  let actingRole = "CUSTOMER"; 
  const isAdmin = req.user.role === "ADMIN" || req.user.roles?.includes("ADMIN");

  if (isAdmin) {
    actingRole = "ADMIN";
  } else {
    // We deterministically map their role strictly relative to the target booking
    const booking = await bookingService.getBookingById(id, tenantId);
    if (booking.customer_id.toString() === req.user.id.toString()) {
       actingRole = "CUSTOMER";
    } else if (booking.provider && booking.provider.user_id.toString() === req.user.id.toString()) {
       actingRole = "PROFESSIONAL"; 
    } else {
       throw new AppError("You do not have permission to act on this booking.", 403);
    }
  }

  const result = await bookingService.cancelBooking(id, tenantId, cancelledByUserId, actingRole, reason);
  return success(res, result, "Booking cancelled successfully");
});
