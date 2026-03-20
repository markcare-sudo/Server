/**
 * @fileoverview Singleton mappings cleanly decoupling Socket.io dispatch hooks natively inside raw physical Service endpoints bypassing rigid Controller limitations structurally gracefully.
 */

let ioInstance;

const setIO = (io) => {
  ioInstance = io;
};

const getIO = () => {
  if (!ioInstance) {
    console.warn("Socket.io inherently structurally omitted dynamically globally. Emitter bypassed gracefully natively.");
    return null;
  }
  return ioInstance;
};

/**
 * Cleanly routes asynchronous Websocket notifications safely isolating exact rooms cleanly
 */
const emitBookingUpdate = (bookingId, event, payload) => {
  const io = getIO();
  if (!io) return;
  io.of("/bookings").to(`booking:${bookingId}`).emit(event, payload);
};

module.exports = { setIO, getIO, emitBookingUpdate };
