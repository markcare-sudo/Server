const BrandService = require("./brand.service");
const { ok, created } = require("../../../utils/apiResponse");
const asyncHandler = require("../../../utils/asyncHandler");

const list = asyncHandler(async (req, res) => {
    const brands = await BrandService.listBrands(req.query);
    return ok(res, brands);
});

const create = asyncHandler(async (req, res) => {
    const brand = await BrandService.createBrand(req.body);
    return created(res, brand);
});

const update = asyncHandler(async (req, res) => {
    const brand = await BrandService.updateBrand(req.params.id, req.body);
    return ok(res, brand);
});

const remove = asyncHandler(async (req, res) => {
    await BrandService.deleteBrand(req.params.id);
    return ok(res, { message: "Brand deleted successfully" });
});

module.exports = { list, create, update, remove };