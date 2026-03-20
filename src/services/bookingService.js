/**
 * @fileoverview Business logic for Bookings.
 */

const { Op } = require("sequelize");
const { sequelize } = require("../config/db");
const { Booking } = require("../models/Booking");
const { BookingTimeline } = require("../models/BookingTimeline");
const { Service } = require("../models/Service");
const { ServiceVariant } = require("../models/ServiceVariant");
const { ServiceProvider } = require("../models/ServiceProvider");
const { ServiceProviderAvailability } = require("../models/ServiceProviderAvailability");
const { User } = require("../modules/control-panel/ima/users/user.model");
const notificationService = require("./notificationService");
const { emitBookingUpdate } = require("../utils/socketEmitter");
const { log: auditLog } = require("../utils/auditLogger");
const AppError = require("../utils/AppError");

const BOOKING_STATUSES = Object.freeze({
  PENDING: "PENDING",
  CONFIRMED: "CONFIRMED",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
  NO_SHOW: "NO_SHOW",
});

const STATUS_TRANSITIONS = {
  [BOOKING_STATUSES.PENDING]: [BOOKING_STATUSES.CONFIRMED, BOOKING_STATUSES.CANCELLED],
  [BOOKING_STATUSES.CONFIRMED]: [BOOKING_STATUSES.IN_PROGRESS, BOOKING_STATUSES.CANCELLED, BOOKING_STATUSES.NO_SHOW],
  [BOOKING_STATUSES.IN_PROGRESS]: [BOOKING_STATUSES.COMPLETED],
};

/**
 * Creates a new booking and auto-assigns the nearest available provider.
 * @param {number|string} tenantId 
 * @param {number|string} customerId 
 * @param {Object} bookingData 
 * @returns {Promise<Object>}
 */
const createBooking = async (tenantId, customerId, bookingData) => {
  const { 
    service_id, 
    service_variant_id, 
    booking_datetime, 
    service_address, 
    service_latitude, 
    service_longitude, 
    payment_method, 
    notes 
  } = bookingData;

  const targetDate = new Date(booking_datetime);
  if (isNaN(targetDate.getTime())) {
    throw new AppError("Invalid booking_datetime format.", 400);
  }

  // Find Service & Price
  let basePrice = 0;
  if (service_variant_id) {
    const variant = await ServiceVariant.findOne({ where: { id: service_variant_id, service_id } });
    if (!variant) throw new AppError("Service variant not found.", 404);
    basePrice = parseFloat(variant.price);
  } else {
    const service = await Service.findOne({ where: { id: service_id, tenant_id: tenantId } });
    if (!service) throw new AppError("Service not found.", 404);
    basePrice = parseFloat(service.base_price);
  }

  const finalPrice = basePrice; // Phase 1 discounts = 0

  // 1. Find Nearest Available Provider (Assumed 50km radius for fallback limits)
  const nearbyProviders = await ServiceProvider.findNearby(tenantId, service_latitude, service_longitude, 50);

  // 2. Filter out non-verified
  const verifiedProviders = nearbyProviders.filter(p => p.verification_status === "VERIFIED");

  if (verifiedProviders.length === 0) {
    throw new AppError("No available provider in your area", 422);
  }

  // JS getDay() returns 0 (Sun) to 6 (Sat)
  const dayOfWeek = targetDate.getDay(); 
  let assignedProvider = null;

  for (const provider of verifiedProviders) {
    const schedule = await ServiceProviderAvailability.findOne({
      where: {
        service_provider_id: provider.id,
        day_of_week: dayOfWeek,
        is_available: true
      }
    });

    if (schedule) {
      assignedProvider = provider.id;
      break; 
    }
  }

  if (!assignedProvider) {
    throw new AppError("No available provider in your area", 422);
  }

  const t = await sequelize.transaction();
  try {
    const booking = await Booking.create({
      tenant_id: tenantId,
      customer_id: customerId,
      service_id,
      service_variant_id: service_variant_id || null,
      service_provider_id: assignedProvider,
      booking_datetime: targetDate,
      service_address,
      service_latitude,
      service_longitude,
      status: BOOKING_STATUSES.PENDING,
      base_price: basePrice,
      discount_amount: 0,
      final_price: finalPrice,
      payment_method,
      payment_status: "PENDING",
      notes
    }, { transaction: t, userId: customerId }); 

    await t.commit();

    const fetchedBooking = await getBookingById(booking.id, tenantId);
    
    // Non-blocking asynchronous triggers gracefully bypassing main structural cascades naturally 
    notificationService.notify(fetchedBooking.customer, 'BOOKING_CONFIRMED', { booking: fetchedBooking, provider: fetchedBooking.provider });
    if (fetchedBooking.provider && fetchedBooking.provider.user) {
        notificationService.notify(fetchedBooking.provider.user, 'PROVIDER_ASSIGNED', { booking: fetchedBooking });
        
        emitBookingUpdate(booking.id, 'booking:provider_assigned', {
          bookingId: booking.id,
          provider: {
            name: `${fetchedBooking.provider.first_name} ${fetchedBooking.provider.last_name}`,
            rating: fetchedBooking.provider.rating,
            phone: fetchedBooking.provider.phone
          }
        });
    }

    auditLog({
      userId: customerId,
      action: 'BOOKING_CREATED',
      module: 'Booking',
      entityId: fetchedBooking.id,
      newValues: { service: fetchedBooking.Service, provider: fetchedBooking.provider },
      tenantId
    });

    return fetchedBooking;
  } catch (err) {
    await t.rollback();
    throw new AppError(`Failed to create booking: ${err.message}`, 500);
  }
};

/**
 * Updates the progression status of a booking.
 */
const updateBookingStatus = async (bookingId, tenantId, newStatus, changedByUserId, notes) => {
  const booking = await Booking.findOne({ where: { id: bookingId, tenant_id: tenantId } });
  if (!booking) {
    throw new AppError("Booking not found.", 404);
  }

  const allowedTransitions = STATUS_TRANSITIONS[booking.status] || [];
  if (!allowedTransitions.includes(newStatus)) {
    throw new AppError(`Invalid transition from ${booking.status} to ${newStatus}.`, 400);
  }

  const oldStatus = booking.status;

  try {
    booking.status = newStatus;
    // Notes usually attach dynamically to the timelines if constructed right, but hooks just catch states.
    await booking.save({ userId: changedByUserId }); 
    
    const fetchedBooking = await getBookingById(booking.id, tenantId);
    if (newStatus === "COMPLETED") {
       notificationService.notify(fetchedBooking.customer, 'BOOKING_COMPLETED', { booking: fetchedBooking });
    }
    
    emitBookingUpdate(booking.id, 'booking:status_updated', {
      bookingId: booking.id,
      status: newStatus,
      timestamp: new Date().toISOString(),
      notes
    });

    auditLog({
      userId: changedByUserId,
      action: 'BOOKING_STATUS_CHANGED',
      module: 'Booking',
      entityId: booking.id,
      oldValues: { status: oldStatus },
      newValues: { status: newStatus },
      tenantId
    });

    return fetchedBooking;
  } catch (err) {
    throw new AppError(`Failed to update booking: ${err.message}`, 500);
  }
};

/**
 * Cancels a booking processing refunds dynamically.
 */
const cancelBooking = async (bookingId, tenantId, cancelledByUserId, userRole, reason) => {
  const booking = await Booking.findOne({ where: { id: bookingId, tenant_id: tenantId } });
  if (!booking) {
    throw new AppError("Booking not found.", 404);
  }

  const permissions = booking.canBeCancelledBy(cancelledByUserId, userRole);
  if (!permissions.allowed) {
    throw new AppError(permissions.reason, 403);
  }

  const bookingTime = new Date(booking.booking_datetime).getTime();
  const now = Date.now();
  const diffHours = (bookingTime - now) / (1000 * 60 * 60);

  let refundPercentage = 0;
  if (diffHours > 24) refundPercentage = 100;
  else if (diffHours > 2) refundPercentage = 50;
  else refundPercentage = 0;

  const refundAmount = parseFloat(booking.final_price) * (refundPercentage / 100);

  try {
    booking.status = BOOKING_STATUSES.CANCELLED;
    booking.cancelled_by = userRole; 
    booking.cancellation_reason = reason;
    booking.refund_amount = refundAmount;
    
    await booking.save({ userId: cancelledByUserId });

    const fetchedBooking = await getBookingById(bookingId, tenantId);
    notificationService.notify(fetchedBooking.customer, 'BOOKING_CANCELLED', { booking: fetchedBooking, refundAmount });

    auditLog({
      userId: cancelledByUserId,
      action: 'BOOKING_CANCELLED',
      module: 'Booking',
      entityId: bookingId,
      newValues: { reason, refundAmount },
      tenantId
    });

    return { 
      booking: fetchedBooking, 
      refundAmount, 
      refundPercentage 
    };
  } catch (err) {
    throw new AppError(`Failed to cancel booking: ${err.message}`, 500);
  }
};

/**
 * Fetches booking cleanly eager-loaded.
 */
const getBookingById = async (bookingId, tenantId) => {
  const booking = await Booking.findOne({
    where: { id: bookingId, tenant_id: tenantId },
    include: [
      { model: User, as: "customer", attributes: ["id", "name", "email", "phone"] },
      { model: ServiceProvider, as: "provider" },
      { model: Service },
      { model: ServiceVariant },
      { model: BookingTimeline, as: "timeline" }
    ],
    order: [
      [{ model: BookingTimeline, as: 'timeline' }, 'changed_at', 'ASC'] 
    ]
  });

  if (!booking) {
    throw new AppError("Booking not found.", 404);
  }

  return booking;
};

/**
 * Lists paginated bookings.
 */
const listBookings = async (tenantId, filters) => {
  const { customerId, providerId, status, dateFrom, dateTo, offset, limit } = filters;
  
  const where = { tenant_id: tenantId };
  if (customerId) where.customer_id = customerId;
  if (providerId) where.service_provider_id = providerId;
  if (status) where.status = status;
  
  if (dateFrom || dateTo) {
    where.booking_datetime = {};
    if (dateFrom) where.booking_datetime[Op.gte] = new Date(dateFrom);
    if (dateTo) where.booking_datetime[Op.lte] = new Date(dateTo);
  }

  try {
    const { count, rows } = await Booking.findAndCountAll({
      where,
      limit,
      offset,
      order: [["booking_datetime", "DESC"]],
      include: [
        { model: User, as: "customer", attributes: ["id", "name"] },
        { model: ServiceProvider, as: "provider", attributes: ["id", "first_name", "last_name", "category"] },
        { model: Service, attributes: ["id", "name"] }
      ]
    });

    return { count, rows };
  } catch (err) {
    throw new AppError(`Failed to list bookings: ${err.message}`, 500);
  }
};

module.exports = {
  BOOKING_STATUSES,
  createBooking,
  updateBookingStatus,
  cancelBooking,
  getBookingById,
  listBookings
};
