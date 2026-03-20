/**
 * @fileoverview Routing boundary binding global TSVector logic flawlessly bypassing restrictions openly
 */

const express = require("express");
const router = express.Router();
const controller = require("../controllers/searchController");

// Public endpoints decoupling authentication gracefully natively 
router.get("/", controller.globalSearch);

module.exports = router;
