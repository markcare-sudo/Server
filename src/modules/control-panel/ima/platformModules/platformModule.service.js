const PlatformModule = require("./platformModule.model");
const ApiError = require("../../../../core/errors/ApiError");
const { generateCodeFromName } = require("../../../../utils/generateCode");
const { sequelize } = require("../../../../config/db");
const { Permission } = require("../permissions/permission.model");
const PlatformFeature = require("../platformFeatures/platformFeature.model");
const { Role } = require("../roles/role.model");
const { Op } = require("sequelize");

/* ---------------- LIST ---------------- */
async function listModules(query) {
  let { search, page = 1, limit = 10, startDate, endDate, status } = query;

  page = parseInt(page);
  limit = parseInt(limit);

  const offset = (page - 1) * limit;

  const where = {};

  // ✅ CASE-INSENSITIVE SEARCH
  if (search) {
    const searchValue = `%${search.toLowerCase()}%`;

    where[Op.or] = [
      sequelize.where(
        sequelize.fn("LOWER", sequelize.col("name")),   // ✅ FIX
        { [Op.like]: searchValue }
      ),
      sequelize.where(
        sequelize.fn("LOWER", sequelize.col("code")),   // ✅ FIX
        { [Op.like]: searchValue }
      ),
      sequelize.where(
        sequelize.fn("LOWER", sequelize.col("description")), // ✅ FIX
        { [Op.like]: searchValue }
      ),
    ];
  }

  // ✅ STATUS FILTER
  if (status) {
    if (status === "ACTIVE") where.is_active = true;
    if (status === "INACTIVE") where.is_active = false;
  }

  // ✅ DATE FILTER
  if (startDate || endDate) {
    where.created_at = {};

    if (startDate) where.created_at[Op.gte] = new Date(startDate);
    if (endDate) where.created_at[Op.lte] = new Date(endDate);
  }

  // ✅ FIND + COUNT
  const { rows, count } = await PlatformModule.findAndCountAll({
    where,
    attributes: [
      "id", "code", "name", "description", "path",
      "has_features", "sort_order", "is_active",
      "created_at", "updated_at",
    ],
    order: [["sort_order", "ASC"]],
    limit,
    offset,
  });

  // ✅ RETURN STRUCTURED RESPONSE
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

/* ---------------- GET MODULES, FEATURES AND PERMISSIONS ---------------- */
async function getModulesFeaturesPermissions(roleId) {
  // 1. Fetch the specific role to check its code (Prevents global Super Admin bypass)
  const role = await Role.findByPk(roleId);
  if (!role) throw new ApiError(404, "Role not found");

  const isSuperAdmin = role.code === 'SUPER_ADMIN';
  const isRegularUser = !isSuperAdmin;

  // 2. Hierarchical Query
  const modules = await PlatformModule.findAll({
    attributes: ["id", "name", "code", "path", "has_features", "sort_order"],
    where: { is_active: true },
    include: [
      /* Module-level permissions (for has_features: false) */
      {
        model: Permission,
        as: "permissions",
        attributes: ["id", "code", "action"],
        where: { feature_id: null },
        required: false,
        include: isSuperAdmin ? [] : [{
          model: Role,
          as: "Roles",
          where: { id: roleId },
          attributes: [],
          through: { attributes: [] }
        }]
      },
      /* Feature-level permissions (for has_features: true) */
      {
        model: PlatformFeature,
        as: "features",
        attributes: ["id", "name", "code"],
        required: false,
        include: [{
          model: Permission,
          as: "permissions",
          attributes: ["id", "code", "action"],
          required: isRegularUser,
          include: isSuperAdmin ? [] : [{
            model: Role,
            as: "Roles",
            where: { id: roleId },
            attributes: [],
            through: { attributes: [] }
          }]
        }]
      }
    ],
    order: [["sort_order", "ASC"], [{ model: PlatformFeature, as: "features" }, "sort_order", "ASC"]]
  });

  // 3. Final Filter: Only return modules the user actually has access to
  if (isSuperAdmin) return modules;
  return modules.filter(m =>
    (m.permissions && m.permissions.length > 0) ||
    (m.features && m.features.length > 0)
  );
}

/* ---------------- GET ONE ---------------- */
async function getModule(id) {
  const data = await PlatformModule.findByPk(id);
  if (!data) throw new ApiError(404, "Platform module not found");
  return data;
}

/* ---------------- CREATE ---------------- */
async function createModule(payload) {
  const name = payload.name?.trim();
  const path = payload.path?.trim();

  // 1. Pre-flight Check (Faster than waiting for DB Error)
  const existing = await PlatformModule.findOne({
    where: {
      [Op.or]: [{ name }, { path }]
    }
  });

  if (existing) {
    const field = existing.name === name ? "Name" : "Path";
    throw new ApiError(409, `Module ${field} already exists`);
  }

  const code = generateCodeFromName(name);

  return sequelize.transaction(async (t) => {
    const module = await PlatformModule.create(
      { ...payload, name, path, code },
      { transaction: t }
    );

    // 2. Pro-Tip: Even if it has features, the Module itself 
    // usually needs a 'VIEW' permission to appear in the Sidebar.
    const actions = module.has_features ? ["READ"] : ["READ", "WRITE", "UPDATE", "DELETE"];

    const permissionRows = actions.map((action) => ({
      code: `${code}.${action}`,
      module_id: module.id,
      action,
      description: `${action} ${name}`,
    }));

    await Permission.bulkCreate(permissionRows, { transaction: t });

    return module;
  });
}

/* ---------------- UPDATE ---------------- */
async function updateModule(id, payload) {
  if (!id) throw new ApiError(400, "Module ID is required");

  // 1. Fetch current module state
  const module = await PlatformModule.findByPk(id);
  if (!module) throw new ApiError(404, "Module not found");

  const name = payload?.name?.trim() || module.name;
  const path = payload?.path?.trim() || module.path;
  const newCode = generateCodeFromName(name);
  const oldCode = module.code;

  // 2. Pre-flight Uniqueness Check (Excluding current ID)
  const existing = await PlatformModule.findOne({
    where: {
      [Op.or]: [{ name }, { path }],
      id: { [Op.ne]: id } // "Not Equal" to current ID
    }
  });

  if (existing) {
    const field = existing.name === name ? "Name" : "Path";
    throw new ApiError(409, `Another module already exists with this ${field}`);
  }

  return sequelize.transaction(async (t) => {
    try {
      // 3. Update the Module
      await module.update(
        { ...payload, name, path, code: newCode },
        { transaction: t }
      );

      // 4. Update ALL associated Permission codes if the Name/Code changed
      // This ensures sub-features and module-level permissions stay in sync
      if (newCode !== oldCode) {
        // Find all permissions linked to this module
        const permissions = await Permission.findAll({
          where: { module_id: id },
          transaction: t
        });

        for (const perm of permissions) {
          const updatedCode = perm.code.replace(oldCode, newCode);
          const updatedDesc = perm.description.replace(module.name, name);

          await perm.update({
            code: updatedCode,
            description: updatedDesc
          }, { transaction: t });
        }
      }

      // 5. If transitioning from "Has Features" to "No Features", 
      // ensure the standard CRUD permissions exist.
      if (!module.has_features) {
        const actions = ["READ", "WRITE", "UPDATE", "DELETE"];
        for (const action of actions) {
          // upsert ensures they exist without creating duplicates
          await Permission.upsert({
            module_id: id,
            feature_id: null,
            action,
            code: `${newCode}.${action}`,
            description: `${action} ${name}`
          }, { transaction: t });
        }
      }

      return module;
    } catch (err) {
      if (err.name === "SequelizeUniqueConstraintError") {
        const field = err.errors[0]?.path;
        throw new ApiError(409, `Module ${field} already exists`);
      }
      throw err;
    }
  });
}

/* ---------------- DELETE ---------------- */
async function deleteModule(id) {
  const module = await getModule(id);

  return sequelize.transaction(async (t) => {
    // 1. Hard delete permissions
    await Permission.destroy({ where: { module_id: module.id }, transaction: t, force: true });

    // 2. Hard delete features
    await PlatformFeature.destroy({ where: { module_id: module.id }, transaction: t, force: true });

    // 3. Hard delete module
    await module.destroy({ transaction: t, force: true }); // <--- FORCE TRUE

    return true;
  });
}

module.exports = {
  listModules,
  getModulesFeaturesPermissions,
  getModule,
  createModule,
  updateModule,
  deleteModule,
};