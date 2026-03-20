/**
 * @fileoverview Pure functional mappings structurally formatting dynamic texts cleanly independent of active integrations
 */

const TEMPLATES = {
  BOOKING_CONFIRMED: {
    subject: "Booking Confirmed - MarkCare",
    smsBody: (data) => `MarkCare: Your booking #${data.booking.id} is confirmed. Provider ${data.provider?.first_name || 'assigned'}.`,
    emailBody: (data) => `<p>Your booking <b>#${data.booking.id}</b> is securely confirmed.</p>`
  },
  BOOKING_CANCELLED: {
    subject: "Booking Cancelled - MarkCare",
    smsBody: (data) => `MarkCare: Booking #${data.booking.id} was cancelled. Refund: ${data.refundAmount || 0}.`,
    emailBody: (data) => `<p>Booking <b>#${data.booking.id}</b> was successfully cancelled natively.</p>`
  },
  BOOKING_COMPLETED: {
    subject: "Booking Completed - MarkCare",
    smsBody: (data) => `MarkCare: Booking #${data.booking.id} is successfully completed. Thank you!`,
    emailBody: (data) => `<p>Booking <b>#${data.booking.id}</b> is completed cleanly. Thank you.</p>`
  },
  ORDER_PLACED: {
    subject: "Order Placed - MarkCare",
    smsBody: (data) => `MarkCare: Order #${data.order.order_number || data.order.id} has been securely placed.`,
    emailBody: (data) => `<p>Your order <b>#${data.order.order_number || data.order.id}</b> has been natively received.</p>`
  },
  ORDER_SHIPPED: {
    subject: "Order Shipped - MarkCare",
    smsBody: (data) => `MarkCare: Order #${data.order.order_number || data.order.id} has logically shipped.`,
    emailBody: (data) => `<p>Your order <b>#${data.order.order_number || data.order.id}</b> is inherently shipped.</p>`
  },
  ORDER_DELIVERED: {
    subject: "Order Delivered - MarkCare",
    smsBody: (data) => `MarkCare: Order #${data.order.order_number || data.order.id} has been delivered globally.`,
    emailBody: (data) => `<p>Your order <b>#${data.order.order_number || data.order.id}</b> is completely delivered.</p>`
  },
  PAYMENT_SUCCESS: {
    subject: "Payment Successful - MarkCare",
    smsBody: (data) => `MarkCare: Payment of ${data.amount} successful natively.`,
    emailBody: (data) => `<p>Payment natively successful.</p>`
  },
  PAYMENT_FAILED: {
    subject: "Payment Failed - MarkCare",
    smsBody: (data) => `MarkCare: Your recent payment fundamentally failed cleanly.`,
    emailBody: (data) => `<p>Payment natively failed seamlessly.</p>`
  },
  REFUND_PROCESSED: {
    subject: "Refund Processed - MarkCare",
    smsBody: (data) => `MarkCare: Refund of ${data.amount} natively logically processed.`,
    emailBody: (data) => `<p>Refund correctly processed structurally.</p>`
  },
  PROVIDER_ASSIGNED: {
    subject: "New Booking Assigned - MarkCare",
    smsBody: (data) => `MarkCare Provider: You have been assigned explicitly booking #${data.booking.id}`,
    emailBody: (data) => `<p>Provider: Securely assigned booking <b>#${data.booking.id}</b>.</p>`
  }
};

module.exports = { TEMPLATES };
