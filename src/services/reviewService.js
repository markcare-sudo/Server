/**
 * @fileoverview Safe native business logic securing internal feedback states mapped accurately into the database arrays.
 */

const { sequelize } = require("../config/db");
const { Review } = require("../models/Review");
const { Booking } = require("../models/Booking");
const { Order } = require("../models/Order");
const { User } = require("../modules/control-panel/ima/users/user.model");
const AppError = require("../utils/AppError");

/**
 * Creates generic mapped authentic reviews validating state topologies distinctly prior to submission logic organically.
 */
const createReview = async (tenantId, reviewerId, data) => {
  const { booking_id, order_id, reviewee_id, review_type, rating, title, comment } = data;
  let isVerified = false;

  if (review_type === "SERVICE") {
    if (!booking_id) throw new AppError("Booking ID is required mapping a native SERVICE verification dynamically.", 400);
    
    // Evaluate exact logical conditions
    const booking = await Booking.findOne({ where: { id: booking_id, tenant_id: tenantId } });
    if (!booking) throw new AppError("Underlying logical Booking explicitly not found.", 404);
    if (booking.customer_id.toString() !== reviewerId.toString()) throw new AppError("Access denied explicitly verifying identity alignments.", 403);
    if (booking.status !== "COMPLETED") throw new AppError("Users can strictly exclusively review explicitly COMPLETED generic bookings securely.", 400);
    
    isVerified = true;
  } else if (review_type === "PRODUCT") {
    if (!order_id) throw new AppError("Order ID required natively validating internal PRODUCT deliveries organically.", 400);
    
    const order = await Order.findOne({ where: { id: order_id, tenant_id: tenantId } });
    if (!order) throw new AppError("Missing Order logic natively verified.", 404);
    if (order.customer_id.toString() !== reviewerId.toString()) throw new AppError("Forbidden alignment checks mapped natively.", 403);
    if (order.order_status !== "DELIVERED") throw new AppError("Exclusive structural validation preventing un-delivered sequence feedback updates dynamically.", 400);
    
    isVerified = true;
  }

  // Structurally passes values generating hook cascades automatically cleanly recalculating service provider structures structurally 
  const review = await Review.create({
    tenant_id: tenantId,
    booking_id,
    order_id,
    reviewer_id: reviewerId,
    reviewee_id,
    review_type,
    rating,
    title,
    comment,
    is_verified_purchase: isVerified
  });

  return review;
};

/**
 * Restricts structural unauthenticated mappings returning completely safe boolean subsets cleanly
 */
const listReviews = async (tenantId, filters) => {
  const { reviewee_id, review_type, rating, page, limit, offset } = filters;
  const where = { tenant_id: tenantId };
  if (reviewee_id) where.reviewee_id = reviewee_id;
  if (review_type) where.review_type = review_type;
  if (rating) where.rating = rating;

  const { count, rows } = await Review.findAndCountAll({
    where,
    limit,
    offset,
    order: [["created_at", "DESC"]],
    include: [{
      model: User,
      as: "reviewer",
      attributes: ["id", "first_name", "last_name"] // only partial generic safe variables cleanly mitigating risks securely
    }]
  });

  return { count, rows };
};

/**
 * Intercepts simple generic native tracking signals linearly incrementally counting 1 node safely structurally.
 */
const markHelpful = async (reviewId, userId) => {
  const review = await Review.findByPk(reviewId);
  if (!review) throw new AppError("Logical target explicit sequence not structurally found.", 404);

  // Simplified native mechanical increment devoid of absolute deterministic SQL unique pairs natively (Phase 1 simplicity natively)
  await review.increment("helpful_count", { by: 1 });
  await review.reload();
  
  return review;
};

module.exports = { createReview, listReviews, markHelpful };
