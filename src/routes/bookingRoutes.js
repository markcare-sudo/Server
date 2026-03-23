/**
 * @fileoverview Presentation route mapping for the Booking Ecosystem.
 */

const express = require("express");
const router = express.Router();
const controller = require("../controllers/bookingController");
const requireAuth = require("../middlewares/requireAuth");
const validate = require("../middlewares/validate");
const { createBookingSchema, updateStatusSchema, cancelBookingSchema } = require("../validators/bookingValidator");

/**
 * @swagger
 * /bookings:
 *   post:
 *     summary: Create a new booking
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               service_id:
 *                 type: integer
 *               service_variant_id:
 *                 type: integer
 *               booking_datetime:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Booking created successfully
 *       400:
 *         description: Validation or business logic error
 *       401:
 *         description: Unauthorized
 */
router.post("/", requireAuth, validate(createBookingSchema), controller.createBooking);
router.get("/", requireAuth, controller.getMyBookings);
router.get("/provider", requireAuth, controller.getProviderBookings);
/**
 * @swagger
 * /bookings/{id}:
 *   get:
 *     summary: Get a specific booking by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Successfully fetched booking details
 *       400:
 *         description: Invalid booking ID
 *       401:
 *         description: Unauthorized
 */
router.get("/:id", requireAuth, controller.getBookingById);
router.patch("/:id/status", requireAuth, validate(updateStatusSchema), controller.updateStatus);
router.patch("/:id/cancel", requireAuth, validate(cancelBookingSchema), controller.cancelBooking);

module.exports = router;
