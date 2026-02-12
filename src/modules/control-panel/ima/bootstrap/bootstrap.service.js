// src/modules/control-plane/iam/bootstrap/bootstrap.service.js
const bcrypt = require("bcryptjs");
const ApiError = require("../../../../core/errors/ApiError");
const { User } = require("../users/user.model");
const { Role } = require("../roles/role.model");
const { Permission } = require("../permissions/permission.model");
const { UserRole, RolePermission } = require("../assignments/joins.model");

/* ---------------------------------------------------------
   CREATE SUPER ADMIN (PLATFORM LEVEL)
--------------------------------------------------------- */
async function createSuperAdmin({ name, email, password }) {
  if (!name || !email || !password) {
    throw new ApiError(400, "name, email, password required");
  }

  // allow only when NO users exist
  const userCount = await User.count();
  if (userCount > 0) throw new ApiError(403, "Bootstrap disabled (users already exist)");

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password_hash: passwordHash,
    tenant_id: null,
    is_super_admin: true,
    is_active: true,
  });

  // create SUPER_ADMIN role (platform level → tenantId null)
  const role = await Role.create({
    tenant_id: null,
    name: "SUPER_ADMIN",
    code: "SUPER_ADMIN",
    is_active: true,
  });

  await UserRole.create({ user_id: user.id, role_id: role.id });

  return { id: user.id, email: user.email };
}

/* ---------------------------------------------------------
   CREATE PERMISSIONS
--------------------------------------------------------- */
async function createPermissions({ permissions }) {
  if (!Array.isArray(permissions) || !permissions.length) {
    throw new ApiError(400, "permissions[] required");
  }

  const keys = permissions.map(p => p.key);
  const existing = await Permission.findAll({ where: { key: keys } });
  const existingKeys = new Set(existing.map(p => p.key));

  const toCreate = permissions
    .filter(p => p.key && p.module && p.action)
    .filter(p => !existingKeys.has(p.key));

  if (toCreate.length) await Permission.bulkCreate(toCreate);

  return { created: toCreate.length, skipped: permissions.length - toCreate.length };
}

/* ---------------------------------------------------------
   CREATE ROLE (TENANT LEVEL)
--------------------------------------------------------- */
async function createRole({ name, code }) {
  if (!name) throw new ApiError(400, "name required");

  const roleCode = (code || name).toUpperCase().replace(/[^A-Z0-9]+/g, "_");

  const exists = await Role.findOne({ where: { code: roleCode } });
  if (exists) throw new ApiError(409, "Role already exists");

  return Role.create({ name, code: roleCode, is_active: true });
}

/* ---------------------------------------------------------
   ASSIGN ROLE → PERMISSIONS
--------------------------------------------------------- */
async function assignRolePermissions({ roleId, permissionIds, permissionKeys }) {
  if (!roleId) throw new ApiError(400, "roleId required");

  const role = await Role.findOne({ where: { id: roleId } });
  if (!role) throw new ApiError(404, "Role not found");

  let perms = [];
  if (permissionIds?.length) perms = await Permission.findAll({ where: { id: permissionIds } });
  else if (permissionKeys?.length) perms = await Permission.findAll({ where: { key: permissionKeys } });
  else throw new ApiError(400, "permissionIds[] or permissionKeys[] required");

  if (!perms.length) throw new ApiError(404, "No permissions found");

  const rows = perms.map(p => ({ roleId: role.id, permissionId: p.id }));
  await RolePermission.bulkCreate(rows, { ignoreDuplicates: true });

  return { assigned: rows.length };
}

/* ---------------------------------------------------------
   ASSIGN USER → ROLE
--------------------------------------------------------- */
async function assignUserRole({ userId, roleId }) {
  if (!userId || !roleId) {
    throw new ApiError(400, "userId, roleId required");
  }

  const user = await User.findOne({ where: { id: userId } });
  if (!user) throw new ApiError(404, "User not found");

  const role = await Role.findOne({ where: { id: roleId } });
  if (!role) throw new ApiError(404, "Role not found");

  await UserRole.findOrCreate({ where: { user_id: userId, role_id: roleId } });

  return { success: true };
}

module.exports = {
  createSuperAdmin,
  createPermissions,
  createRole,
  assignRolePermissions,
  assignUserRole,
};
