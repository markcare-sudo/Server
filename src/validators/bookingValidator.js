const Joi = require("joi");
const { BOOKING_STATUSES } = require("../services/bookingService");

const createBookingSchema = Joi.object({
  service_id: Joi.number().required(),
  service_variant_id: Joi.number().optional().allow(null),
  booking_datetime: Joi.date().greater('now').required(),
  service_address: Joi.string().required(),
  service_latitude: Joi.number().min(-90).max(90).required(),
  service_longitude: Joi.number().min(-180).max(180).required(),
  payment_method: Joi.string().required(),
  notes: Joi.string().optional().allow("", null)
});

const updateStatusSchema = Joi.object({
  status: Joi.string().valid(...Object.values(BOOKING_STATUSES)).required(),
  notes: Joi.string().optional().allow("", null)
});

const cancelBookingSchema = Joi.object({
  reason: Joi.string().required()
});

module.exports = {
  createBookingSchema,
  updateStatusSchema,
  cancelBookingSchema
};
