const router = require("express").Router();
const authMiddleware = require("../../../middlewares/auth.middleware");
const upload = require("../../../middlewares/upload.middleware");
const ServiceController = require("./service.controller");

// PUBLIC
router.get("/", ServiceController.list);
router.get("/slug/:slug", ServiceController.getDetails);
router.get("/:id", ServiceController.getDetailsById);

// ADMIN
router.post("/", authMiddleware, upload.array("images"), ServiceController.create);
router.put("/:id", authMiddleware, upload.array("images"), ServiceController.update);
router.delete("/:id", authMiddleware, ServiceController.remove);

module.exports = router;