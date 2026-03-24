const router = require("express").Router();
const authMiddleware = require("../../../../middlewares/auth.middleware");
const ServiceVisitController = require("./serviceVisit.controller");

// Admin/Technician: Update visit status
router.patch("/:id/complete", authMiddleware, ServiceVisitController.updateStatus);

// Customer: Schedule a visit from their subscription
router.post("/subscription/:subscriptionId/schedule", authMiddleware, ServiceVisitController.schedule);

module.exports = router;