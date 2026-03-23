/* modules/enquiry/callback-request.controller.js */

const CallbackRequestService = require("./callbackRequest.service");

async function create(req, res, next) {
  try {
    const data = await CallbackRequestService.createCallbackRequest(req.body);
    res.status(201).json({ success: true, message:"Callback requested successfully", data });
  } catch (e) {
    next(e);
  }
}

async function list(req, res, next) {
  try {
    const { page, limit, status } = req.query;
    const result = await CallbackRequestService.listCallbackRequests({ page, limit, status });
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

module.exports = { create, list, updateStatus };