const { ok } = require("../../../utils/apiResponse");
const asyncHandler = require("../../../utils/asyncHandler");
const BookingService = require("./serviceBooking.service");

exports.create = asyncHandler(async (req, res) => {
    const data = await BookingService.createBooking(req.user.id, req.body);
    return ok(res, data, "Booking created");
});

exports.verifyPayment = asyncHandler(async (req, res) => {
    const booking = await BookingService.verifyPayment(req.body);
    return ok(res, booking, "Payment verified");
});

exports.getUserBookings = asyncHandler(async (req, res) => {
    const data = await BookingService.getUserBookings(req.user.id);
    return ok(res, data);
});

exports.getAll = asyncHandler(async (req, res) => {
    const data = await BookingService.getAllBookings();
    return ok(res, data);
});

exports.getOne = asyncHandler(async (req, res) => {
    const data = await BookingService.getBookingById(req.params.id);
    return ok(res, data);
});

exports.update = asyncHandler(async (req, res) => {
    const data = await BookingService.updateBooking(req.params.id, req.body);
    return ok(res, data);
});

exports.assignTechnician = asyncHandler(async (req, res) => {
    const data = await BookingService.assignTechnician(req.params.id, req.body.technician_id);
    return ok(res, data);
});

exports.cancel = asyncHandler(async (req, res) => {
    const data = await BookingService.cancelBooking(req.params.id);
    return ok(res, data, "Booking cancelled");
});