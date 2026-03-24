const ProductService = require("./product.service");
const { ok, created } = require("../../../utils/apiResponse");
const asyncHandler = require("../../../utils/asyncHandler");

const list = asyncHandler(async (req, res) => {
    const data = await ProductService.listProducts(req.query);
    return ok(res, data);
});

const getDetails = asyncHandler(async (req, res) => {
    const { slug } = req.params;
    const product = await ProductService.getBySlug(slug);
    return ok(res, product);
});

const create = asyncHandler(async (req, res) => {
    // Logic: Payload should include 'variants' array for Flipkart-style entry
    const product = await ProductService.createProduct(req.body);
    return created(res, product);
});

const update = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updatedProduct = await ProductService.updateProduct(id, req.body);
    return ok(res, updatedProduct);
});

const remove = asyncHandler(async (req, res) => {
    const { id } = req.params;
    await ProductService.deleteProduct(id);
    return ok(res, { message: "Product and associated variants deleted successfully" });
});

module.exports = { list, getDetails, create, update, remove };