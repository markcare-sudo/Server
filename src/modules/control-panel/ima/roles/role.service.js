/* modules/iam/roles/role.service.js */

const { sequelize } = require("../../../../config/db");
const { generateCodeFromName } = require("../../../../utils/generateCode");
const { attachPermissionToRole } = require("../assignments/assignment.service");
const { Role } = require("./role.model");
const { RolePermission } = require("../assignments/joins.model");
const { Permission } = require("../permissions/permission.model");
const { log } = require("../../../../utils/auditLogger");
const { Op } = require("sequelize");

/**
 * Seed default RBAC for new tenant
 */
async function seedTenantRBAC(user, transaction) {

  const labAdminRole = await Role.create(
    {
      name: "Lab Admin",
      code: "LAB_ADMIN",
      description: "Full administrative access within this tenant",
      is_active: true,
      created_by: userId || null,
      updated_by: userId || null,
    },
    { transaction }
  );

  await attachPermissionToRole({
    roleId: labAdminRole.id,
    permissionId: null, // attach ALL permissions
    transaction,
  });

  await log({
    tenantId: tenantId,
    userId: userId,
    action: "RBAC_SEED",
    module: "roles",
    entityId: labAdminRole.id,
    description: "Default LAB_ADMIN role created during tenant setup",
  });

  return {
    labAdminRoleId: labAdminRole.id,
    rolesCreated: 1,
  };
}

/**
 * Create role with permissions
 */
async function createRole(user, payload) {
  const { name, description, permissions = [] } = payload;

  if (!name) {
    const err = new Error("Role name is required");
    err.status = 400;
    throw err;
  }

  const code = generateCodeFromName(name);

  return sequelize.transaction(async (transaction) => {

    // ✅ Check for duplicate role (by name or code)
    const existingRole = await Role.findOne({
      where: {
        [Op.or]: [
          { name: name.trim() },
          { code: code }
        ]
      },
      transaction
    });

    if (existingRole) {
      const err = new Error("Role already exists");
      err.status = 409; // conflict
      throw err;
    }

    // ✅ Create role
    const role = await Role.create(
      {
        name,
        code,
        description: description || null,
        is_active: true,
        created_by: user.id || null,
        updated_by: user.id || null,
      },
      { transaction }
    );

    // ✅ Assign permissions
    if (permissions.length) {
      const rows = permissions.map((permissionId) => ({
        role_id: role.id,
        permission_id: permissionId,
      }));

      await RolePermission.bulkCreate(rows, { transaction });
    }

    // ✅ Log activity
    await log({
      userId: user.id,
      action: "CREATE",
      module: "roles",
      entityId: role.id,
      newValues: role.toJSON(),
      description: `Role '${role.name}' created`,
    });

    return role;
  });
}

/**
 * Update role + sync permissions
 */
async function updateRole(user, id, payload) {
  const { name, description, permissions = [] } = payload;

  // 1. Get the role and capture "oldRole" state for audit logging
  const role = await Role.findByPk(id);

  if (!role) {
    const err = new Error("Role not found");
    err.status = 404;
    throw err;
  }

  // ✅ Fix: Capture the snapshot BEFORE updating
  const oldRole = role.toJSON();

  return sequelize.transaction(async (transaction) => {
    // 2. Update role basic info
    await role.update({
      name,
      description,
      updated_by: user.id
    }, { transaction });

    // 3. Sync Permissions
    if (permissions) {
      const existing = await RolePermission.findAll({
        where: { role_id: id },
        attributes: ["permission_id"],
        transaction
      });

      const existingIds = existing.map(p => p.permission_id);
      const toInsert = permissions.filter(p => !existingIds.includes(p));
      const toDelete = existingIds.filter(p => !permissions.includes(p));

      if (toInsert.length) {
        const rows = toInsert.map(permissionId => ({
          role_id: id,
          permission_id: permissionId,
        }));
        await RolePermission.bulkCreate(rows, { transaction });
      }

      if (toDelete.length) {
        await RolePermission.destroy({
          where: {
            role_id: id,
            permission_id: toDelete
          },
          transaction
        });
      }
    }

    // 4. Audit Log
    await log({
      userId: user.id,
      action: "UPDATE",
      module: "roles",
      entityId: role.id,
      oldValues: oldRole, // ✅ Now defined
      newValues: { name, description, permissions },
      description: `Role '${role.name}' updated`,
    });

    return role;
  });
}

/**
 * List roles
 */
async function listRoles(query) {
  let { search, page = 1, limit = 10, startDate, endDate, status } = query;

  page = parseInt(page);
  limit = parseInt(limit);

  const offset = (page - 1) * limit;

  const where = {};

  // ✅ CASE-INSENSITIVE SEARCH (FIXED + PREFIXED)
  if (search) {
    const searchValue = `%${search.toLowerCase()}%`;

    where[Op.or] = [
      sequelize.where(
        sequelize.fn("LOWER", sequelize.col("Role.name")),
        { [Op.like]: searchValue }
      ),
      sequelize.where(
        sequelize.fn("LOWER", sequelize.col("Role.code")),
        { [Op.like]: searchValue }
      ),
      sequelize.where(
        sequelize.fn("LOWER", sequelize.col("Role.description")),
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

  // ✅ FIND + COUNT (recommended)
  const { rows, count } = await Role.findAndCountAll({
    where,
    attributes: [
      "id",
      "code",
      "name",
      "description",
      "is_active",
      "created_by",
      "updated_by",
      "created_at",
      "updated_at",
    ],
    include: [
      {
        model: Permission,
        attributes: ["id", "action", "module_id"],
        through: { attributes: [] },
      },
    ],
    order: [["created_at", "DESC"]],
    limit,
    offset,
  });

  return {
    data: rows.map(role => ({
      id: role.id,
      name: role.name,
      code: role.code,
      is_active: role.is_active,
      description: role.description,
      permissions: role.Permissions.map(p => p.id),
    })),
    pagination: {
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    },
  };
}

async function getRoleWithTree(id) {

  const role = await Role.findOne({
    where: { id },
    include: [
      {
        model: Permission,
        attributes: ["id"],
        through: { attributes: [] },
      },
    ],
  });

  if (!role) throw new Error("Role not found");

  const selectedPermissions = role.Permissions.map(p => p.id);

  const modules = await PlatformModule.findAll({
    include: [
      {
        model: PlatformFeature,
        as: "features",
        include: [
          {
            model: Permission,
            attributes: ["id", "action"],
          },
        ],
      },
    ],
  });

  return {
    role: {
      id: role.id,
      name: role.name,
      description: role.description,
      permissions: selectedPermissions,
    },
    tree: modules,
  };
}

async function getRole(id) {

  const role = await Role.findOne({
    where: {
      id,
    },
    include: [
      {
        model: Permission,
        attributes: ["id", "code", "action"],
        through: {
          attributes: [],
        },
      },
    ],
  });

  if (!role) {
    const err = new Error("Role not found");
    err.status = 404;
    throw err;
  }

  return {
    id: role.id,
    name: role.name,
    description: role.description,
    permissions: role.Permissions.map(p => p.id),
  };
}

/**
 * Soft delete role
 */
async function deleteRole(user, id) {

  const role = await Role.findByPk(id);

  if (!role) {
    const err = new Error("Role not found");
    err.status = 404;
    throw err;
  }

  await role.destroy(); // paranoid soft delete

  await log({
    userId: user.id,
    action: "DELETE",
    module: "roles",
    entityId: role.id,
    description: `Role '${role.name}' soft deleted`,
  });

  return true;
}


/**
 * Permanent delete role
 */
async function permanentDeleteRole(user, id) {

  const role = await Role.findByPk(id, {
    paranoid: false, // include soft deleted
  });

  if (!role) {
    const err = new Error("Role not found");
    err.status = 404;
    throw err;
  }

  await role.destroy({ force: true });

  await log({
    userId: user.id,
    action: "PERMANENT_DELETE",
    module: "roles",
    entityId: role.id,
    description: `Role '${role.name}' permanently deleted`,
  });

  return true;
}

module.exports = {
  createRole,
  updateRole,
  deleteRole,
  permanentDeleteRole,
  listRoles,
  getRoleWithTree,
  getRole,
  seedTenantRBAC,
};