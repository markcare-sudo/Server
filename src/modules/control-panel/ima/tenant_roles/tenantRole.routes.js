// src/modules/iam/tenantRoles/tenantRole.routes.js

const router = require("express").Router();
const controller = require("./tenantRole.controller");
const auth = require("../../../../middlewares/auth.middleware");
const permit = require("../../../../middlewares/rbac.middleware");

router.post("/", auth, permit("TENANT.ROLES.MANAGE"), controller.create);
router.get("/:tenant_id", auth, permit("TENANT.ROLES.VIEW"), controller.list);
router.delete("/:id", auth, permit("TENANT.ROLES.MANAGE"), controller.remove);

module.exports = router;
