const MaintenanceService = require("./maintenance.service");
const { ok, created } = require("../../../../utils/apiResponse");
const asyncHandler = require("../../../../utils/asyncHandler");

// Plans (Catalog)
const getPlans = asyncHandler(async (req, res) => {
    const plans = await MaintenanceService.listPlans(req.query);
    return ok(res, plans);
});

const createPlan = asyncHandler(async (req, res) => {
    const plan = await MaintenanceService.createPlan(req.body);
    return created(res, plan);
});

// Subscriptions
const purchaseSubscription = asyncHandler(async (req, res) => {
    const { planId } = req.body;
    const userId = req.user.id;
    const subscription = await MaintenanceService.subscribeUser(userId, planId, req.body);
    return created(res, subscription);
});

const mySubscriptions = asyncHandler(async (req, res) => {
    const data = await MaintenanceService.getUserSubscriptions(req.user.id);
    return ok(res, data);
});

const adminListSubscriptions = asyncHandler(async (req, res) => {
    const data = await MaintenanceService.listAllSubscriptions(req.query);
    return ok(res, data);
});

module.exports = {
    getPlans,
    createPlan,
    purchaseSubscription,
    mySubscriptions,
    adminListSubscriptions
};