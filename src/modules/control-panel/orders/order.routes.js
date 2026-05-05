// const router = require("express").Router();
// const authMiddleware = require("../../../middlewares/auth.middleware");
// const OrderController = require("./order.controller");

// // =========================
// // USER
// // =========================
// router.post("/", authMiddleware, OrderController.create);
// router.post("/verify", authMiddleware, OrderController.verify);

// router.get("/all", authMiddleware, OrderController.listAll);
// router.get("/", authMiddleware, OrderController.list);
// router.get("/:id", authMiddleware, OrderController.getDetails);

// router.put("/cancel/:id", authMiddleware, OrderController.cancel);

// // =========================
// // ADMIN
// // =========================
// router.put("/:id/status", authMiddleware, OrderController.updateStatus);
// router.delete("/:id", authMiddleware, OrderController.remove);

// module.exports = router;








const router = require("express").Router();
const authMiddleware = require("../../../middlewares/auth.middleware");
const OrderController = require("./order.controller");

// =========================
// USER
// =========================
router.post("/", authMiddleware, OrderController.create);
router.post("/verify", authMiddleware, OrderController.verify);

router.get("/", authMiddleware, OrderController.list);

// IMPORTANT: /all must come before /:id
router.get("/all", authMiddleware, OrderController.listAll);

// STRICT numeric id only
router.get("/:id(\\d+)", authMiddleware, OrderController.getDetails);

router.put("/cancel/:id(\\d+)", authMiddleware, OrderController.cancel);

// =========================
// ADMIN
// =========================
router.put("/admin/:id(\\d+)/status", authMiddleware, OrderController.updateStatus);
router.delete("/admin/:id(\\d+)", authMiddleware, OrderController.remove);

module.exports = router;