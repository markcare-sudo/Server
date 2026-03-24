const ServiceVisitService = require("./serviceVisit.service");
const { ok, created } = require("../../../../utils/apiResponse");
const asyncHandler = require("../../../../utils/asyncHandler");

const schedule = asyncHandler(async (req, res) => {
    const { subscriptionId } = req.params;
    const visit = await ServiceVisitService.scheduleSubscriptionVisit(subscriptionId, req.body);
    return created(res, visit);
});

const updateStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const visit = await ServiceVisitService.completeVisit(id, req.body);
    return ok(res, visit);
});

module.exports = { schedule, updateStatus };