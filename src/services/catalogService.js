/**
 * @fileoverview Business logic for the Service Catalog.
 */

const { Op } = require("sequelize");
const { sequelize } = require("../config/db");
const { Service } = require("../models/Service");
const { ServiceVariant } = require("../models/ServiceVariant");
const AppError = require("../utils/AppError");

/**
 * Creates a new service and its variants.
 * @param {number|string} tenantId 
 * @param {Object} data - { name, description, category, base_price, featured_image, variants: [] }
 * @returns {Promise<Object>}
 */
const createService = async (tenantId, data) => {
  const t = await sequelize.transaction();
  try {
    const service = await Service.create({
      tenant_id: tenantId,
      name: data.name,
      description: data.description,
      category: data.category,
      base_price: data.base_price,
      featured_image: data.featured_image,
      is_active: true
    }, { transaction: t });

    if (data.variants && data.variants.length > 0) {
      const variantPayload = data.variants.map(v => ({
        ...v,
        service_id: service.id
      }));
      await ServiceVariant.bulkCreate(variantPayload, { transaction: t });
    }

    await t.commit();
    return await getServiceBySlug(tenantId, service.slug);
  } catch (error) {
    await t.rollback();
    throw new AppError(`Failed to create service: ${error.message}`, 500);
  }
};

/**
 * Updates a service and its variants.
 * @param {number|string} serviceId 
 * @param {number|string} tenantId 
 * @param {Object} data 
 * @returns {Promise<Object>}
 */
const updateService = async (serviceId, tenantId, data) => {
  // Service has a defaultScope for is_active=true. 
  // Updating might include inactive services if admin wants, but typically we just query normally.
  const service = await Service.findOne({ where: { id: serviceId, tenant_id: tenantId } });
  if (!service) {
    throw new AppError("Service not found.", 404);
  }

  const t = await sequelize.transaction();
  try {
    await service.update({
      name: data.name !== undefined ? data.name : service.name,
      description: data.description !== undefined ? data.description : service.description,
      category: data.category !== undefined ? data.category : service.category,
      base_price: data.base_price !== undefined ? data.base_price : service.base_price,
      featured_image: data.featured_image !== undefined ? data.featured_image : service.featured_image,
      is_active: data.is_active !== undefined ? data.is_active : service.is_active
    }, { transaction: t });

    if (data.variants && Array.isArray(data.variants)) {
      await ServiceVariant.destroy({ where: { service_id: service.id }, transaction: t });
      
      const variantPayload = data.variants.map(v => ({
        ...v,
        service_id: service.id
      }));
      await ServiceVariant.bulkCreate(variantPayload, { transaction: t });
    }

    await t.commit();
    return await getServiceBySlug(tenantId, service.slug);
  } catch (error) {
    await t.rollback();
    throw new AppError(`Failed to update service: ${error.message}`, 500);
  }
};

/**
 * Lists services with pagination and filters.
 * @param {number|string} tenantId 
 * @param {Object} filters 
 * @returns {Promise<Object>}
 */
const listServices = async (tenantId, filters) => {
  const { category, search, offset, limit } = filters;
  const where = { tenant_id: tenantId };

  if (category) {
    where.category = category;
  }

  if (search) {
    where[Op.and] = [
      sequelize.literal(`search_vector @@ plainto_tsquery('english', ${sequelize.escape(search)})`)
    ];
  }

  try {
    const order = search 
      ? [[sequelize.literal(`ts_rank(search_vector, plainto_tsquery('english', ${sequelize.escape(search)}))`), 'DESC']] 
      : [["created_at", "DESC"]];

    const { count, rows } = await Service.findAndCountAll({
      where,
      limit,
      offset,
      order,
      include: [
        {
          model: ServiceVariant,
          as: "variants",
          where: { is_active: true },
          required: false
        }
      ]
    });

    return { count, rows };
  } catch (error) {
    throw new AppError(`Failed to list services: ${error.message}`, 500);
  }
};

/**
 * Gets a service by slug.
 * @param {number|string} tenantId 
 * @param {string} slug 
 * @returns {Promise<Object>}
 */
const getServiceBySlug = async (tenantId, slug) => {
  const service = await Service.findOne({
    where: { tenant_id: tenantId, slug },
    include: [
      {
        model: ServiceVariant,
        as: "variants",
        where: { is_active: true },
        required: false
      }
    ]
  });

  if (!service) {
    throw new AppError("Service not found.", 404);
  }

  return service;
};

/**
 * Soft deletes a service and deactivates its variants.
 * @param {number|string} serviceId 
 * @param {number|string} tenantId 
 * @returns {Promise<void>}
 */
const deleteService = async (serviceId, tenantId) => {
  const service = await Service.findOne({ where: { id: serviceId, tenant_id: tenantId } });
  if (!service) {
    throw new AppError("Service not found.", 404);
  }

  const t = await sequelize.transaction();
  try {
    await service.update({ is_active: false }, { transaction: t });
    await ServiceVariant.update({ is_active: false }, { 
      where: { service_id: service.id }, 
      transaction: t 
    });
    await t.commit();
  } catch (error) {
    await t.rollback();
    throw new AppError(`Failed to delete service: ${error.message}`, 500);
  }
};

module.exports = {
  createService,
  updateService,
  listServices,
  getServiceBySlug,
  deleteService
};
