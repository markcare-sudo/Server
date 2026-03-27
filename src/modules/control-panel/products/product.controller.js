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
    const productBase = JSON.parse(req.body.product || "{}");
    const variants = JSON.parse(req.body.variants || "[]");

    // SANITIZE: Convert empty strings to null for BigInt/Int fields
    const sanitizedProduct = {
        ...productBase,
        brand_id: productBase.brand_id === "" ? null : productBase.brand_id,
        category_id: productBase.category_id === "" ? null : productBase.category_id,
    };

    // SANITIZE VARIANTS: Ensure stock and price are numbers, not empty strings
    const sanitizedVariants = variants.map(v => ({
        ...v,
        price: v.price === "" ? 0 : parseFloat(v.price),
        stock_quantity: v.stock_quantity === "" ? 0 : parseInt(v.stock_quantity, 10),
    }));

    const images = req.files ? req.files.map(file => ({
        url: `/uploads/products/${file.filename}`,
        fieldName: file.fieldname
    })) : [];

    const product = await ProductService.createProduct({
        ...sanitizedProduct,
        variants: sanitizedVariants,
        images
    });

    return created(res, product);
});

const update = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const productBase = JSON.parse(req.body.product || "{}");
    const variants = JSON.parse(req.body.variants || "[]");

    const images = req.files ? req.files.map(file => ({
        url: `/uploads/${file.filename}`,
        fieldName: file.fieldname
    })) : [];

    const updatedProduct = await ProductService.updateProduct(id, {
        ...productBase,
        variants,
        images
    });

    return ok(res, updatedProduct);
});

const remove = asyncHandler(async (req, res) => {
    const { id } = req.params;
    await ProductService.deleteProduct(id);
    return ok(res, { message: "Product and associated variants deleted successfully" });
});

module.exports = { list, getDetails, create, update, remove };