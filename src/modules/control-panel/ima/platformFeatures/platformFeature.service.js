const { sequelize } = require("../../../../config/db");
const PlatformFeature = require("./platformFeature.model");
const ApiError = require("../../../../core/errors/ApiError");
const { Permission } = require("../permissions/permission.model");
const { generateCodeFromName } = require("../../../../utils/generateCode");
const PlatformModule = require("../platformModules/platformModule.model");
const { Op } = require("sequelize");
const { log } = require("../../../../utils/auditLogger");

/* ---------------- LIST ---------------- */
async function listFeatures(query) {
  let { search, page = 1, limit = 10, startDate, endDate, status, moduleId } = query;

  page = parseInt(page);
  limit = parseInt(limit);

  const offset = (page - 1) * limit;

  const where = {};

  // ✅ CASE-INSENSITIVE SEARCH (WITH ALIAS)
  if (search) {
    const searchValue = `%${search.toLowerCase()}%`;

    where[Op.or] = [
      // ✅ MAIN TABLE → use actual DB table name
      sequelize.where(
        sequelize.fn("LOWER", sequelize.col("platform_features.name")),
        { [Op.like]: searchValue }
      ),
      sequelize.where(
        sequelize.fn("LOWER", sequelize.col("platform_features.code")),
        { [Op.like]: searchValue }
      ),
      sequelize.where(
        sequelize.fn("LOWER", sequelize.col("platform_features.description")),
        { [Op.like]: searchValue }
      ),

      // ✅ INCLUDED TABLE → use alias
      sequelize.where(
        sequelize.fn("LOWER", sequelize.col("module.name")),
        { [Op.like]: searchValue }
      ),
    ];
  }

  // ✅ STATUS FILTER
  if (status) {
    if (status === "ACTIVE") where.is_active = true;
    if (status === "INACTIVE") where.is_active = false;
  }

  // ✅ MODULE FILTER
  if (moduleId) {
    where.module_id = moduleId;
  }

  // ✅ DATE FILTER
  if (startDate || endDate) {
    where.created_at = {};
    if (startDate) where.created_at[Op.gte] = new Date(startDate);
    if (endDate) where.created_at[Op.lte] = new Date(endDate);
  }

  // ✅ FIND + COUNT
  const { rows, count } = await PlatformFeature.findAndCountAll({
    where,
    attributes: [
      "id", "code", "name", "description", "module_id",
      "sort_order", "is_active",
      "created_at", "updated_at",
    ],
    include: [
      {
        model: PlatformModule,
        as: "module", // ⚠️ IMPORTANT (used in search)
        attributes: ["id", "code", "name"],
      },
    ],
    order: [["id", "DESC"]],
    limit,
    offset,
  });

  return {
    data: rows,
    pagination: {
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    },
  };
}

/* ---------------- GET ONE ---------------- */
async function getFeature(id) {
  const data = await PlatformFeature.findByPk(id);
  if (!data) throw new ApiError(404, "Platform feature not found");
  return data;
}

/* ---------------- BULK CREATE FEATURES ---------------- */
async function bulkCreateFeatures(payload) {
  const { module_id, features } = payload;

  if (!module_id || !Array.isArray(features) || features.length === 0) {
    throw new ApiError(400, "module_id and features array are required");
  }

  const module = await PlatformModule.findByPk(module_id);
  if (!module) throw new ApiError(404, "Platform module not found");

  return sequelize.transaction(async (t) => {

    const createdFeatures = [];

    for (const item of features) {

      if (!item.name) {
        throw new ApiError(400, "Each feature must have a name");
      }

      const name = item.name.trim();
      const code = generateCodeFromName(name);

      const exists = await PlatformFeature.findOne({
        where: { code },
        transaction: t,
      });

      if (exists) {
        throw new ApiError(409, `Feature already exists: ${name}`);
      }

      /* 1️⃣ Create feature */
      const feature = await PlatformFeature.create(
        {
          name,
          code,
          module_id,
        },
        { transaction: t }
      );

      /* 2️⃣ Generate permissions */
      const actions = ["READ", "WRITE", "UPDATE", "DELETE"];

      const permissionRows = actions.map((action) => ({
        code: `${module.code}.${code}.${action}`,
        module_id: module.id,
        feature_id: feature.id,
        action,
        description: `${action} ${name}`,
      }));

      await Permission.bulkCreate(permissionRows, { transaction: t });

      createdFeatures.push(feature);
    }

    return createdFeatures;
  });
}

/* ---------------- CREATE FEATURE ---------------- */
async function createFeature(payload) {
  let { name, module_id } = payload;

  if (!name || !module_id)
    throw new ApiError(400, "name and module_id are required");

  name = name.trim();
  const featureCode = generateCodeFromName(name);

  // 1️⃣ Check if the feature record already exists
  const exists = await PlatformFeature.findOne({ where: { code: featureCode } });

  if (exists) {
    throw new ApiError(409, "Feature already exists");
  }

  const module = await PlatformModule.findByPk(module_id);
  if (!module) throw new ApiError(404, "Platform module not found");

  return sequelize.transaction(async (t) => {
    try {
      /* 2️⃣ Create feature */
      const feature = await PlatformFeature.create(
        { ...payload, name, code: featureCode },
        { transaction: t }
      );

      /* 3️⃣ Create permissions */
      const actions = ["READ", "WRITE", "UPDATE", "DELETE"];
      const permissionRows = actions.map((action) => ({
        code: `${module.code}.${featureCode}.${action}`,
        module_id: module.id,
        feature_id: feature.id,
        action,
        description: `${action} ${name}`,
      }));

      await Permission.bulkCreate(permissionRows, { transaction: t });

      // AUDIT LOG
      await log({
        userId: user.id,
        action: "CREATE",
        module: "PLATFORM_FEATURE",
        entityId: feature.id,
        oldValues: null,
        newValues: feature.toJSON(),
        description: `Added feature for ${feature.name}`
      });

      return feature;
    } catch (error) {
      console.error("DB ERROR:", error);
      throw error;
    }
  });
}

/* ---------------- UPDATE FEATURE ---------------- */
async function updateFeature(id, payload) {

  const feature = await getFeature(id);

  const oldData = feature.toJSON();

  if (payload.name) {

    const name = payload.name.trim();
    const newCode = generateCodeFromName(name);

    const exists = await PlatformFeature.findOne({
      where: { code: newCode }
    });

    if (exists && exists.id !== feature.id) {
      throw new ApiError(409, "Feature already exists");
    }

    await sequelize.transaction(async (t) => {

      // 1️⃣ update feature
      await feature.update(
        { ...payload, name, code: newCode },
        { transaction: t }
      );

      // 2️⃣ update permissions
      const permissions = await Permission.findAll({
        where: { feature_id: feature.id },
        transaction: t
      });

      for (const perm of permissions) {

        const action = perm.action; // READ / WRITE / UPDATE / DELETE

        const newPermissionCode =
          `${perm.code.split('.')[0]}.${newCode}.${action}`;

        await perm.update(
          { code: newPermissionCode, description: `${action} ${name}` },
          { transaction: t }
        );
      }

    });

    // AUDIT LOG
    await log({
      userId: user.id,
      action: "UPDATE",
      module: "PLATFORM_FEATURE",
      entityId: feature.id,
      oldValues: oldData,
      newValues: feature.toJSON(),
      description: `Updated feature for ${feature.name}`
    });

    return feature;
  }

  await feature.update(payload);
  return feature;
}

/* ---------------- DELETE ---------------- */
async function deleteFeature(user, id) {
  const feature = await getFeature(id);

  const oldData = feature.toJSON();

  return sequelize.transaction(async (t) => {

    // 2️⃣ Clear permissions
    await Permission.destroy({
      where: { feature_id: feature.id },
      transaction: t,
      force: true
    });

    // 3️⃣ Finally, delete the feature
    await feature.destroy({ transaction: t, force: true });
    // AUDIT LOG
    await log({
      userId: user.id,
      action: "DELETE",
      module: "PLATFORM_FEATURE",
      entityId: feature.id,
      oldValues: null,
      newValues: oldData,
      description: `Deleted feature for ${feature.name}`
    });

    return true;
  });
}


module.exports = {
  listFeatures,
  getFeature,
  bulkCreateFeatures,
  createFeature,
  updateFeature,
  deleteFeature,
};