let ioInstance;

const setIO = (io) => {
  ioInstance = io;
};

const getIO = () => {
  if (!ioInstance) {
    console.warn("Socket.io not initialized");
    return null;
  }

  return ioInstance;
};

// ==============================
// BOOKING ROOM UPDATE
// ==============================

const emitBookingUpdate = (
  bookingId,
  event,
  payload
) => {

  const io = getIO();

  if (!io) return;

  io.of("/bookings")
    .to(`booking:${bookingId}`)
    .emit(event, payload);
};

// ==============================
// NEW BOOKING
// ==============================

const emitNewBooking = (payload) => {

  const io = getIO();

  if (!io) return;

  io.of("/bookings")
    .to("admins")
    .emit("new-booking", payload);
};

// ==============================
// NEW ORDER
// ==============================

const emitNewOrder = (payload) => {

  const io = getIO();

  if (!io) return;

  io.of("/orders")
    .to("admins")
    .emit("new-order", payload);
};

module.exports = {
  setIO,
  getIO,
  emitBookingUpdate,
  emitNewBooking,
  emitNewOrder
};