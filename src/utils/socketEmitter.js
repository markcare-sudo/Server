// /**
//  * @fileoverview Singleton mappings cleanly decoupling Socket.io dispatch hooks natively inside raw physical Service endpoints bypassing rigid Controller limitations structurally gracefully.
//  */

// let ioInstance;

// const setIO = (io) => {
//   ioInstance = io;
// };

// const getIO = () => {
//   if (!ioInstance) {
//     console.warn("Socket.io inherently structurally omitted dynamically globally. Emitter bypassed gracefully natively.");
//     return null;
//   }
//   return ioInstance;
// };

// /**
//  * Cleanly routes asynchronous Websocket notifications safely isolating exact rooms cleanly
//  */
// const emitBookingUpdate = (bookingId, event, payload) => {
//   const io = getIO();
//   if (!io) return;
//   io.of("/bookings").to(`booking:${bookingId}`).emit(event, payload);
// };

// module.exports = { setIO, getIO, emitBookingUpdate };







/**
 * Socket Manager
 */

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
// NEW BOOKING TO ADMINS
// ==============================

const emitNewBooking = (payload) => {

  const io = getIO();

  if (!io) return;

  io.of("/bookings")
    .to("admins")
    .emit("new-booking", payload);
};

// ==============================
// NEW ORDER TO ADMINS
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