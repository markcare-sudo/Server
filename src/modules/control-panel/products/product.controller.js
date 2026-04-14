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

const getDetailsById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const product = await ProductService.getById(id);
    return ok(res, product);
});

const create = asyncHandler(async (req, res) => {
    const productBase = JSON.parse(req.body.product || "{}");
    const variants = JSON.parse(req.body.variants || "[]");

    const sanitizedProduct = {
        ...productBase,
        brand_id: productBase.brand_id || null,
        category_id: productBase.category_id || null,
    };

    const sanitizedVariants = variants.map(v => ({
        ...v,
        price: parseFloat(v.price || 0),
        stock_quantity: parseInt(v.stock_quantity || 0),
    }));

    // ✅ Cloudinary files
    const images = req.files?.map((file, index) => ({
        url: file.path,
        fieldName: file.fieldname,
        is_primary: file.fieldname === "main_image",
        sort_order: index
    })) || [];

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

    const sanitizedVariants = variants.map(v => ({
        ...v,
        price: parseFloat(v.price || 0),
        stock_quantity: parseInt(v.stock_quantity || 0),
    }));

    // ✅ Cloudinary images
    const images = req.files?.map((file, index) => ({
        url: file.path,
        fieldName: file.fieldname,
        is_primary: file.fieldname === "main_image",
        sort_order: index
    })) || [];

    const updatedProduct = await ProductService.updateProduct(id, {
        ...productBase,
        variants: sanitizedVariants,
        images
    });

    return ok(res, updatedProduct);
});

const remove = asyncHandler(async (req, res) => {
    const { id } = req.params;
    await ProductService.deleteProduct(id);
    return ok(res, { message: "Product deleted successfully" });
});

module.exports = { list, getDetails, getDetailsById, create, update, remove };