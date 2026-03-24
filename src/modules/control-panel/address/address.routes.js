const router = require("express").Router();
const authMiddleware = require("../../../../middlewares/auth.middleware");
const AddressController = require("./address.controller");

// All address routes require authentication
router.use(authMiddleware);

router.get("/", AddressController.list);
router.post("/", AddressController.create);
router.patch("/:id", AddressController.update);
router.delete("/:id", AddressController.remove);

module.exports = router;