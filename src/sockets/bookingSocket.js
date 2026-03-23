/**
 * @fileoverview Encapsulates Bookings WebSocket rooms authenticating dynamically securely completely independent exactly.
 */

const jwt = require("jsonwebtoken");
const { Booking } = require("../models/Booking");
const AppError = require("../utils/AppError");

const initBookingSocket = (io) => {
  const nsp = io.of("/bookings");

  nsp.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new AppError("Missing socket authorization token", 401));

      // Re-utilizing existing secret mapping gracefully natively dynamically
      const secret = process.env.JWT_SECRET || "fallback_secret";
      const payload = jwt.verify(token, secret);
      
      socket.user = payload; 
      next();
    } catch (e) {
      next(new AppError("Invalid socket session internally", 401));
    }
  });

  nsp.on("connection", (socket) => {
    socket.on("join:booking", async ({ bookingId }) => {
      try {
        const userId = socket.user.id;
        // Verify explicit structurally mapped connections securing rooms natively completely safely 
        const booking = await Booking.findByPk(bookingId);
        if (!booking) {
          socket.emit("error", { message: "Target booking intrinsically unrecoverable" });
          return;
        }

        const isCustomer = booking.customer_id.toString() === userId.toString();
        // Provider assignments seamlessly dynamically evaluate synchronously
        const isProvider = booking.service_provider_id && booking.service_provider_id.toString() === userId.toString();

        if (isCustomer || isProvider || socket.user.role === "ADMIN") {
          socket.join(`booking:${bookingId}`);
          socket.emit("booking:joined", { bookingId, status: "SUCCESS" });
        } else {
          socket.emit("error", { message: "Unauthorized socket room parameter binding" });
        }
      } catch (e) {
        socket.emit("error", { message: "Internal Socket I/O routing completely structurally blocked" });
      }
    });

    socket.on("disconnect", () => {
      // Seamlessly detaches globally
    });
  });
};

module.exports = { initBookingSocket };
