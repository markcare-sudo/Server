const { Op } = require("sequelize");
const { sequelize } = require("../../../config/db");
const { Service, ServiceBenefit, MaintenanceSchedule, ServiceImage } = require("./service.model");
const ApiError = require("../../../core/errors/ApiError");
const { Category } = require("../categories/category.model");
const { deleteFile } = require("../../../middlewares/upload.middleware");

/**
 * CREATE SERVICE (WITH BENEFITS + SCHEDULE)
 */
async function createService(data) {
    const { benefits = [], schedule, images = [], name, ...serviceData } = data;

    if (!name) throw new ApiError(400, "Service name is required");

    return await sequelize.transaction(async (t) => {
        const slug = `${name.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`;

        const service = await Service.create(
            { ...serviceData, name, slug },
            { transaction: t }
        );

        // BENEFITS
        if (benefits.length) {
            await ServiceBenefit.bulkCreate(
                benefits.map(b => ({
                    service_id: service.id,
                    benefit_text: b.benefit_text,
                    is_included: b.is_included ?? true
                })),
                { transaction: t }
            );
        }

        // SCHEDULE
        if (schedule && ["AMC", "CMC", "OM"].includes(service.type)) {
            await MaintenanceSchedule.create(
                { ...schedule, service_id: service.id },
                { transaction: t }
            );
        }

        // ✅ IMAGES
        if (images && images.length) {
            await ServiceImage.bulkCreate(
                images.map(img => ({
                    service_id: service.id,
                    image_url: img.image_url,
                    is_primary: img.is_primary,
                    sort_order: img.sort_order
                })),
                { transaction: t }
            );
        }

        return await Service.findByPk(service.id, {
            include: [
                { model: ServiceBenefit, as: "benefits" },
                { model: MaintenanceSchedule, as: "schedule" },
                { model: ServiceImage, as: "images" }
            ],
            transaction: t
        });
    });
}

/**
 * LIST SERVICES
 */
async function listServices(query = {}) {
    const { search, type, page = 1, limit = 20 } = query;

    const where = { is_active: true };

    if (type) where.type = type;
    if (search) where.name = { [Op.iLike]: `%${search}%` };

    const parsedLimit = parseInt(limit) || 20;
    const offset = (Math.max(1, parseInt(page)) - 1) * parsedLimit;

    const { count, rows } = await Service.findAndCountAll({
        where,
        limit: parsedLimit,
        offset,
        distinct: true,
        attributes: ["id", "name", "slug", "description", "base_price", "discount_price", "type", "estimated_duration_mins", "category_id", "is_active", "created_at", "updated_at"],
        include: [
            {
                model: Category,
                as: "category",
                attributes: ["id", "name"]
            },
            { model: ServiceBenefit, as: "benefits", required: false },
            { model: MaintenanceSchedule, as: "schedule", required: false },
            { model: ServiceImage, as: "images" }
        ],
        order: [["created_at", "DESC"]]
    });

    return {
        data: rows,
        pagination: {
            totalItems: count,
            totalPages: Math.ceil(count / parsedLimit),
            currentPage: page
        }
    };
}

async function getById(id) {
    const service = await Service.findOne({
        where: { id, is_active: true },
        include: [
            {
                model: Category,
                as: "category",
                attributes: ["id", "name"]
            },
            {
                model: ServiceBenefit,
                as: "benefits"
            },
            {
                model: MaintenanceSchedule,
                as: "schedule"
            },
            {
                model: ServiceImage,
                as: "images"
            }
        ]
    });

    if (!service) throw new ApiError(404, "Service not found");

    return service;
}

/**
 * GET SERVICE DETAILS
 */
async function getBySlug(slug) {
    const service = await Service.findOne({
        where: { slug, is_active: true },
        include: [
            {
                model: Category,
                as: "category",
                attributes: ["id", "name"]
            },
            {
                model: ServiceBenefit,
                as: "benefits"
            },
            {
                model: MaintenanceSchedule,
                as: "schedule"
            },
            {
                model: ServiceImage,
                as: "images"
            }
        ]
    });

    if (!service) throw new ApiError(404, "Service not found");

    return service;
}

/**
 * UPDATE SERVICE
 */
async function updateService(id, data) {
    const { benefits, schedule, images, ...serviceData } = data;

    return await sequelize.transaction(async (t) => {
        const service = await Service.findByPk(id, { transaction: t });
        if (!service) throw new ApiError(404, "Service not found");

        // =========================
        // ✅ SLUG UPDATE
        // =========================
        if (serviceData.name && serviceData.name !== service.name) {
            serviceData.slug = `${serviceData.name.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`;
        }

        await service.update(serviceData, { transaction: t });

        // =========================
        // ✅ BENEFITS (SAFE REPLACE)
        // =========================
        if (benefits !== undefined) {
            // delete old
            await ServiceBenefit.destroy({
                where: { service_id: id },
                force: true,
                transaction: t
            });

            // insert new
            if (benefits.length) {
                await ServiceBenefit.bulkCreate(
                    benefits.map((b, index) => ({
                        service_id: id,
                        benefit_text: b.benefit_text,
                        is_included: b.is_included ?? true,
                        sort_order: index
                    })),
                    { transaction: t }
                );
            }
        }

        // =========================
        // ✅ SCHEDULE (UPSERT)
        // =========================
        if (schedule !== undefined) {
            const existing = await MaintenanceSchedule.findOne({
                where: { service_id: id },
                transaction: t
            });

            if (existing) {
                await existing.update(schedule, { transaction: t });
            } else {
                await MaintenanceSchedule.create(
                    { ...schedule, service_id: id },
                    { transaction: t }
                );
            }
        }

        // =========================
        // ✅ IMAGES (SAFE FULL REPLACE)
        // =========================
        if (images !== undefined) {
            // 1️⃣ Get old images
            const oldImages = await ServiceImage.findAll({
                where: { service_id: id },
                transaction: t
            });

            // 2️⃣ Delete DB records
            await ServiceImage.destroy({
                where: { service_id: id },
                force: true,
                transaction: t
            });

            // 3️⃣ Delete files safely (DON'T BREAK FLOW)
            for (const img of oldImages) {
                if (img.image_url) {
                    try {
                        await deleteFile(img.image_url);
                    } catch (err) {
                        console.warn("File delete failed:", img.image_url);
                    }
                }
            }

            // 4️⃣ Insert new images
            if (images.length) {
                const payload = images.map((img, index) => ({
                    service_id: id,
                    image_url: img.image_url,
                    is_primary: img.is_primary ?? index === 0,
                    sort_order: img.sort_order ?? index,
                }));

                await ServiceImage.bulkCreate(payload, { transaction: t });
            }
        }

        return service;
    });
}

/**
 * DELETE SERVICE
 */
async function deleteService(id) {
    const service = await Service.findByPk(id);
    if (!service) throw new ApiError(404, "Service not found");

    return await service.destroy(); // soft delete
}

module.exports = {
    createService,
    listServices,
    getBySlug,
    getById,
    updateService,
    deleteService
};