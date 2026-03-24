const router = require("express").Router();
const authMiddleware = require("../../../../middlewares/auth.middleware");
const MaintenanceController = require("./maintenance.controller");

// Public/Customer: View available plans
router.get("/plans", MaintenanceController.getPlans);

// Customer: Manage own subscriptions
router.get("/my-subscriptions", authMiddleware, MaintenanceController.mySubscriptions);
router.post("/subscribe", authMiddleware, MaintenanceController.purchaseSubscription);

// Admin: Control Panel
router.post("/plans", authMiddleware, MaintenanceController.createPlan);
router.get("/admin/subscriptions", authMiddleware, MaintenanceController.adminListSubscriptions);

module.exports = router;