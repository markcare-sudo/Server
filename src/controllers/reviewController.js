/**
 * @fileoverview Connects natively secure Express interfaces structurally bridging robust native Service checks structurally.
 */

const reviewService = require("../services/reviewService");
const asyncHandler = require("../utils/asyncHandler");
const { success, paginated } = require("../utils/apiResponse");
const { getPagination, getPaginationMeta } = require("../utils/pagination");
const AppError = require("../utils/AppError");

exports.createReview = asyncHandler(async (req, res) => {
  const tenantId = req.tenantId;
  const reviewerId = req.user.id;
  
  const data = await reviewService.createReview(tenantId, reviewerId, req.body);
  return success(res, data, "Review successfully published and synced.", 201);
});

exports.listReviews = asyncHandler(async (req, res) => {
  const tenantId = req.tenantId || req.headers['x-tenant-id'];
  if (!tenantId) {
    throw new AppError("Global context parameters missing explicitly mapping x-tenant-id native limits natively.", 400);
  }

  const { reviewee_id, review_type, rating } = req.query;
  const { page, limit, offset } = getPagination(req.query);

  const { count, rows } = await reviewService.listReviews(tenantId, { reviewee_id, review_type, rating, page, limit, offset });
  const paginationMeta = getPaginationMeta(count, page, limit);

  return paginated(res, rows, paginationMeta, "Reviews structurally fetched efficiently");
});

exports.markHelpful = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id; // Unused implicitly but passed internally tracking scaling constraints natively if expanded.
  
  const review = await reviewService.markHelpful(id, userId);
  return success(res, review, "Marked natively generic structures positively successfully");
});
