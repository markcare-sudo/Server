/* modules/enquiry/callback-request.routes.js */

const express = require("express");
const controller = require("./callbackRequest.controller");

const router = express.Router();

router.post("/", controller.create);

router.get("/", controller.list);
router.get("/:id", controller.getById);
router.patch("/:id/status", controller.updateStatus);

module.exports = router;