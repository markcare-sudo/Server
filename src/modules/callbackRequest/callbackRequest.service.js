/* modules/enquiry/callback-request.service.js */

const { Op } = require("sequelize");
const { CallbackRequest } = require("./callbackRequest.model");


async function createCallbackRequest(payload) {
  const { product_name, product_price, phone, email } = payload;

  if (!phone) {
    const err = new Error("phone is required");
    err.status = 400;
    throw err;
  }

  const record = await CallbackRequest.create({
    product_name,
    product_price: product_price || null,
    phone,
    email,
    status: "NEW",
  });

  return record;
}

async function getCallbackRequestById({ id }) {
  const record = await CallbackRequest.findByPk(id);
  return record;
}

async function listCallbackRequests({ page = 1, limit = 10, status, source, search }) {
  const parsedLimit = parseInt(limit, 10) || 10;
  const parsedPage = parseInt(page, 10) || 1;
  const offset = (parsedPage - 1) * parsedLimit;

  const where = {};
  if (status) where.status = status;
  if (source) where.source = source;

  if (search) {
    where[Op.or] = [
      { phone: { [Op.like]: `%${search}%` } },
      { email: { [Op.like]: `%${search}%` } },
      { product_name: { [Op.like]: `%${search}%` } }
    ];
  }

  // 🔴 CRITICAL: Must be findAndCountAll to calculate total entries
  const { count, rows } = await CallbackRequest.findAndCountAll({
    where,
    limit: parsedLimit,
    offset: offset,
    order: [["id", "DESC"]],
  });

  return {
    total_items: count,
    total_pages: Math.ceil(count / parsedLimit),
    current_page: parsedPage,
    limit: parsedLimit,
    data: rows, // This wraps your array safely
  };
}

async function updateCallbackStatus({ id, status }) {
  if (!id || !status) {
    const err = new Error("id and status are required");
    err.status = 400;
    throw err;
  }

  const record = await CallbackRequest.findByPk(id);
  if (!record) {
    const err = new Error("Callback request not found");
    err.status = 404;
    throw err;
  }

  record.status = status;
  await record.save();

  return record;
}

module.exports = {
  createCallbackRequest,
  getCallbackRequestById,
  listCallbackRequests,
  updateCallbackStatus,
};