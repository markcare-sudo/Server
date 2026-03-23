/**
 * @fileoverview Connects presentation constraints mapped strictly handling native feedback loop structures elegantly.
 */

const express = require("express");
const router = express.Router();
const controller = require("../controllers/reviewController");
const requireAuth = require("../middlewares/requireAuth");

// Completely abstracted logical generic endpoints securely decoupled logically out of the box securely 
router.post("/", requireAuth, controller.createReview);
router.get("/", controller.listReviews);
router.patch("/:id/helpful", requireAuth, controller.markHelpful);

module.exports = router;
