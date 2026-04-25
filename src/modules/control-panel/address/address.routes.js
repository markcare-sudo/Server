const router = require("express").Router();
const authMiddleware = require("../../../middlewares/auth.middleware");
const AddressController = require("./address.controller");

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