const router = require("express").Router();
const CatalogController = require("./catalog.controller");

router.get("/", CatalogController.getCatalog);

module.exports = router;