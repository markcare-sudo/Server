/**
 * @fileoverview Business logic for the Product Catalog mirroring the services pipeline organically.
 */

const { Op } = require("sequelize");
const { sequelize } = require("../config/db");
const { Product } = require("../models/Product");
const { ProductVariant } = require("../models/ProductVariant");
const AppError = require("../utils/AppError");

/**
 * Creates a new product safely transacting against nested variants dynamically.
 */
const createProduct = async (tenantId, data) => {
  const t = await sequelize.transaction();
  try {
    const product = await Product.create({
      tenant_id: tenantId,
      name: data.name,
      description: data.description,
      category: data.category,
      featured_image: data.featured_image,
      price: data.price,
      is_active: true
    }, { transaction: t });

    if (data.variants && data.variants.length > 0) {
      const payloads = data.variants.map(v => ({ ...v, product_id: product.id }));
      await ProductVariant.bulkCreate(payloads, { transaction: t });
    }

    await t.commit();
    return await getProductBySlug(tenantId, product.slug);
  } catch (e) {
    await t.rollback();
    throw new AppError(`Failed to create product: ${e.message}`, 500);
  }
};

/**
 * Updates a product resetting variant relationships deterministically inside a transaction block.
 */
const updateProduct = async (productId, tenantId, data) => {
  const product = await Product.findOne({ where: { id: productId, tenant_id: tenantId } });
  if (!product) throw new AppError("Product not found", 404);

  const t = await sequelize.transaction();
  try {
    await product.update({
      name: data.name ?? product.name,
      description: data.description ?? product.description,
      category: data.category ?? product.category,
      featured_image: data.featured_image ?? product.featured_image,
      price: data.price ?? product.price,
      is_active: data.is_active ?? product.is_active
    }, { transaction: t });

    if (data.variants && Array.isArray(data.variants)) {
      await ProductVariant.destroy({ where: { product_id: product.id }, transaction: t });
      const payloads = data.variants.map(v => ({ ...v, product_id: product.id }));
      await ProductVariant.bulkCreate(payloads, { transaction: t });
    }

    await t.commit();
    return await getProductBySlug(tenantId, product.slug);
  } catch(e) {
    await t.rollback();
    throw new AppError(`Failed to update product: ${e.message}`, 500);
  }
};

/**
 * Returns paginated product instances eagerly attached towards active variants embedding unmasked numerical stock volumes.
 */
const listProducts = async (tenantId, filters) => {
  const { category, search, offset, limit } = filters;
  const where = { tenant_id: tenantId };
  if (category) where.category = category;
  
  if (search) {
    where[Op.and] = [
      sequelize.literal(`search_vector @@ plainto_tsquery('english', ${sequelize.escape(search)})`)
    ];
  }

  try {
    const order = search 
      ? [[sequelize.literal(`ts_rank(search_vector, plainto_tsquery('english', ${sequelize.escape(search)}))`), 'DESC']] 
      : [["created_at", "DESC"]];

    const { count, rows } = await Product.findAndCountAll({
      where,
      limit,
      offset,
      order,
      include: [
        {
          model: ProductVariant,
          as: "variants",
          attributes: ["id", "name", "sku", "price", "quantity_in_stock"], // Exposed stock tracking purposefully inside safe lists
          required: false
        }
      ]
    });
    return { count, rows };
  } catch (e) {
    throw new AppError(`Failed to list products: ${e.message}`, 500);
  }
};

const getProductBySlug = async (tenantId, slug) => {
  const product = await Product.findOne({
    where: { tenant_id: tenantId, slug },
    include: [{
      model: ProductVariant,
      as: "variants",
      attributes: ["id", "name", "sku", "price", "quantity_in_stock"],
      required: false
    }]
  });
  
  if (!product) throw new AppError("Product not found", 404);
  return product;
};

const deleteProduct = async (productId, tenantId) => {
  const product = await Product.findOne({ where: { id: productId, tenant_id: tenantId } });
  if (!product) throw new AppError("Product not found", 404);

  const t = await sequelize.transaction();
  try {
    await product.update({ is_active: false }, { transaction: t });
    await t.commit();
  } catch (e) {
    await t.rollback();
    throw new AppError(`Failed to delete product: ${e.message}`, 500);
  }
};

module.exports = { createProduct, updateProduct, listProducts, getProductBySlug, deleteProduct };
