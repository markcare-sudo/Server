const router = require("express").Router();
const authMiddleware = require("../../../middlewares/auth.middleware");
const controller = require("./serviceBooking.controller");
// const auth = require("../../middlewares/auth.middleware");

// USER
router.post("/", authMiddleware, controller.create);
router.post("/verify-payment", authMiddleware, controller.verifyPayment);
router.get("/my", authMiddleware, controller.getUserBookings);
router.get("/:id", authMiddleware, controller.getOne);
router.put("/:id/cancel", authMiddleware, controller.cancel);

// ADMIN
router.get("/", authMiddleware, controller.getAll);
router.put("/:id", authMiddleware, controller.update);
router.put("/:id/assign", authMiddleware, controller.assignTechnician);

module.exports = router;