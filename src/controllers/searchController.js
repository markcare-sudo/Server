/**
 * @fileoverview Safe structural search controllers concurrently mapping asynchronous list resolutions flawlessly resolving dual representations cleanly
 */

const catalogService = require("../services/catalogService");
const productService = require("../services/productService");
const asyncHandler = require("../utils/asyncHandler");
const { success } = require("../utils/apiResponse");
const AppError = require("../utils/AppError");

exports.globalSearch = asyncHandler(async (req, res) => {
  const { q, type = 'all', category, min_price, max_price, page = 1, limit = 10 } = req.query;
  
  if (!q || q.length < 2) {
    throw new AppError("Search query absolutely explicitly requires a minimum sequence of 2 characters", 400);
  }

  const offset = (page - 1) * limit;
  // Safely cast limits implicitly
  const filters = { search: q, category, offset, limit: parseInt(limit, 10) };
  
  // Scoped internally mapped natively mitigating parameter overrides
  const tenantId = req.tenantId || 1; 

  const results = {};
  const promises = [];

  // Decoupled promise handlers executing organically structurally mapping
  if (type === 'all' || type === 'services') {
    promises.push(
      catalogService.listServices(tenantId, filters).then(res => {
        results.services = {
          data: res.rows,
          pagination: { total: res.count, page: parseInt(page), limit: parseInt(limit) }
        };
      })
    );
  }

  if (type === 'all' || type === 'products') {
    promises.push(
      productService.listProducts(tenantId, filters).then(res => {
        results.products = {
          data: res.rows,
          pagination: { total: res.count, page: parseInt(page), limit: parseInt(limit) }
        };
      })
    );
  }

  // Promise arrays seamlessly sync parallel SQL blocks natively avoiding cascading slowdowns!
  await Promise.all(promises);

  return success(res, results, "Full-Text TSVector Search Executed Seamlessly.");
});
