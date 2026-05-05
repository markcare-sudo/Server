const router = require("express").Router();
const authMiddleware = require("../../../middlewares/auth.middleware");
const requirePermission = require("../../../middlewares/rbac.middleware");
const AddressController = require("./address.controller");

requirePermission()

router.use(authMiddleware);

router
    .route("/")
    .get(AddressController.list)
    .post(AddressController.create);

router
    .route("/:id")
    .put(AddressController.update)
    .delete(AddressController.remove);

module.exports = router;