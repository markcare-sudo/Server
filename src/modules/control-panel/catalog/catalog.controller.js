const CatalogService = require("./catalog.service");
const asyncHandler = require("../../../utils/asyncHandler");
const { ok } = require("../../../utils/apiResponse");

const getCatalog = asyncHandler(async (req, res) => {
    const data = await CatalogService.getCatalog(req.query);
    return ok(res, data);
});

module.exports = { getCatalog };