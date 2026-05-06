const ServiceService = require("./service.service");
const { ok, created } = require("../../../utils/apiResponse");
const asyncHandler = require("../../../utils/asyncHandler");

const safeParse = (data, fallback) => {
    try {
        if (!data) return fallback;
        return typeof data === "string" ? JSON.parse(data) : data;
    } catch {
        return fallback;
    }
};

const list = asyncHandler(async (req, res) => {
    const data = await ServiceService.listServices(req.query);
    return ok(res, data);
});

const getDetails = asyncHandler(async (req, res) => {
    const { slug } = req.params;
    const service = await ServiceService.getBySlug(slug);
    return ok(res, service);
});

const getDetailsById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const service = await ServiceService.getById(id);
    return ok(res, service);
});

const create = asyncHandler(async (req, res) => {
    const base = req.body || {};

    const benefits = safeParse(req.body.benefits, []);
    const schedule = safeParse(req.body.schedule, null);

    // ✅ IMAGES FROM CLOUDINARY
    const images = (req.files || []).map((file, index) => ({
        url: file.filename, // cloudinary url
        is_primary: index === 0,
        sort_order: index
    }));

    const service = await ServiceService.createService({
        ...base,
        benefits,
        schedule,
        images
    });

    return created(res, service);
});

const update = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const base = req.body || {};

    const benefits = safeParse(req.body.benefits, []);
    const schedule = safeParse(req.body.schedule, null);

    const images = (req.files || []).map((file, index) => ({
        url: file.filename,
        is_primary: index === 0,
        sort_order: index
    }));

    const updated = await ServiceService.updateService(id, {
        ...base,
        benefits,
        schedule,
        images
    });

    return ok(res, updated);
});

const remove = asyncHandler(async (req, res) => {
    const { id } = req.params;
    await ServiceService.deleteService(id);
    return ok(res, { message: "Service deleted successfully" });
});

module.exports = { list, getDetails, getDetailsById, create, update, remove };