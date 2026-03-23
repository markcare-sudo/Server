/* modules/enquiry/callback-request.service.js */

const { CallbackRequest } = require("./callbackRequest.model");


async function createCallbackRequest(payload) {
  const { product_name, product_price, phone, email } = payload;

  if (!phone ) {
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

async function listCallbackRequests({ page = 1, limit = 10, status }) {
  const offset = (page - 1) * limit;

  const where = {};
  if (status) where.status = status;

  const records = await CallbackRequest.findAll({
    where,
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [["id", "DESC"]],
  });

  return records;
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
  listCallbackRequests,
  updateCallbackStatus,
};