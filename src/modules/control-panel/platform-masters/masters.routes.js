const router = require("express").Router();
const MastersController = require("./masters.controller");

const auth = require("../../../middlewares/auth.middleware");
const requirePermission = require("../../../middlewares/rbac.middleware");

/**
 * TENANT MASTER DATA
 */
router.post("/", auth, requirePermission("TENANT.MASTERS.CREATE"), MastersController.create);
router.get("/", auth, requirePermission("TENANT.MASTERS.VIEW"), MastersController.list);
router.get("/:id", auth, requirePermission("TENANT.MASTERS.VIEW"), MastersController.get);
router.put("/:id", auth, requirePermission("TENANT.MASTERS.UPDATE"), MastersController.update);
router.patch("/:id/status", auth, requirePermission("TENANT.MASTERS.UPDATE"), MastersController.toggleStatus);

module.exports = router;
