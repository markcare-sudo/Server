/**
 * @fileoverview Presentation boundaries exclusively delegating Promos internally mapped safely.
 */

const couponService = require("../services/couponService");
const asyncHandler = require("../utils/asyncHandler");
const { success, paginated } = require("../utils/apiResponse");
const { getPagination, getPaginationMeta } = require("../utils/pagination");

exports.createCoupon = asyncHandler(async (req, res) => {
  const data = await couponService.createCoupon(req.tenantId, req.body);
  return success(res, data, "Promotions explicitly structured gracefully.", 201);
});

exports.listCoupons = asyncHandler(async (req, res) => {
  const { page, limit, offset } = getPagination(req.query);
  const { count, rows } = await couponService.listCoupons(req.tenantId, { page, limit, offset });
  const meta = getPaginationMeta(count, page, limit);
  return paginated(res, rows, meta, "Promotional schemas tracked sequentially.");
});
