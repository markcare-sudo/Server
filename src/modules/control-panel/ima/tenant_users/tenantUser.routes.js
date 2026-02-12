// src/modules/iam/tenantUsers/tenantUser.routes.js

const router = require("express").Router();
const controller = require("./tenantUser.controller");
const auth = require("../../../../middlewares/auth.middleware");
const permit = require("../../../../middlewares/rbac.middleware");

router.post("/", auth, permit("TENANT.STAFF.CREATE"), controller.create);
router.get("/:tenant_role_id", auth, permit("TENANT.STAFF.VIEW"), controller.list);
router.delete("/:id", auth, permit("TENANT.STAFF.DELETE"), controller.remove);

module.exports = router;
