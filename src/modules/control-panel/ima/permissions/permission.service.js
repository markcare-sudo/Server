/* src/modules/iam/permissions/permission.service.js */
const { Op } = require("sequelize");
const ApiError = require("../../../../core/errors/ApiError");
const { Permission } = require("./permission.model");
const { UserRole, RolePermission } = require("../assignments/joins.model"); // ✅ correct



async function createPermission({ key, moduleKey, page, action, description }) {
  if (!key || !moduleKey || !page || !action) {
    throw new ApiError(400, "key, moduleKey, page, action required");
  }

  const exists = await Permission.findOne({ where: { key } });
  if (exists) throw new ApiError(409, "Permission key already exists");

  return Permission.create({
    key,
    module: moduleKey, // DB column should be `module`
    page,
    action,
    description: description || null,
  });
}

async function listPermissions() {
  return Permission.findAll({ order: [["id", "DESC"]] });
}

/**
 * ✅ REQUIRED FOR RBAC
 * returns ["lis.patients.view", "lis.patients.create", ...]
 */
async function getUserPermissions(userId) {
  if (!userId) throw new ApiError(400, "userId required");

  // 1) roleIds for user
  const userRoles = await UserRole.findAll({
    where: { user_id: userId }, // Your DB uses snake_case
    attributes: ["role_id"],
  });

  // FIX: Access the exact property name returned by the query
  // Since you used attributes: ["role_id"], Sequelize puts it in .role_id
  const roleIds = [...new Set(userRoles.map((r) => r.role_id || r.roleId))];
  
  if (roleIds.length === 0) return [];

  // 2) permissionIds for those roles
  const rolePerms = await RolePermission.findAll({
    where: { role_id: { [Op.in]: roleIds } }, 
    attributes: ["permission_id"],
  });

  const permissionIds = [...new Set(rolePerms.map((rp) => rp.permission_id || rp.permissionId))];
  if (permissionIds.length === 0) return [];

  // 3) fetch permission keys
  const perms = await Permission.findAll({
    where: { id: { [Op.in]: permissionIds } },
    // IMPORTANT: Your DB result showed the column is 'code', not 'key'
    attributes: ["code"], 
  });

  return perms.map((p) => p.code);
}

module.exports = { createPermission, listPermissions, getUserPermissions };
