/* modules/enquiry/callback-request.controller.js */

const CallbackRequestService = require("./callbackRequest.service");

async function create(req, res, next) {
  try {
    const data = await CallbackRequestService.createCallbackRequest(req.body);
    res.status(201).json({ success: true, message: "Callback requested successfully", data });
  } catch (e) {
    next(e);
  }
}


async function list(req, res, next) {
  try {
    // 1. Destructure all supported query filters from the request
    const { page, limit, status, source, search } = req.query;

    // 2. Forward the filters cleanly down to the database service layer
    const result = await CallbackRequestService.listCallbackRequests({
      page,
      limit,
      status,
      source,
      search
    });

    // 3. Return a standardized layout response containing pagination metadata and records
    res.json({
      success: true,
      data: result
    });
  } catch (e) {
    next(e);
  }
}


async function getById(req, res, next) {
  try {
    const { id } = req.params;
    const result = await CallbackRequestService.getCallbackRequestById({ id });
    res.json({ success: true, data: result });
  } catch (e) {
    next(e);
  }
}


async function updateStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const updated = await CallbackRequestService.updateCallbackStatus({ id, status });
    res.json({ success: true, message: "Updated Successfully", data: updated });
  } catch (e) {
    next(e);
  }
}


module.exports = { create, list, getById, updateStatus };