const CategoryService = require("./category.service");
const { ok, created } = require("../../../utils/apiResponse");
const asyncHandler = require("../../../utils/asyncHandler");

const list = asyncHandler(async (req, res) => {
    const categories = await CategoryService.listCategories(req.query);
    return ok(res, categories);
});

const create = asyncHandler(async (req, res) => {
    const category = await CategoryService.createCategory(req.body);
    return created(res, category);
});

const update = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const category = await CategoryService.updateCategory(id, req.body);
    return ok(res, category);
});

const remove = asyncHandler(async (req, res) => {
    const { id } = req.params;
    await CategoryService.deleteCategory(id);
    return ok(res, { message: "Category deleted successfully" });
});

module.exports = { list, create, update, remove };