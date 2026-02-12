/* modules/iam/assignments/assignment.service.js */

const ApiError = require("../../../../core/errors/ApiError");

const { User } = require("../users/user.model");
const { Role } = require("../roles/role.model");
const { Permission } = require("../permissions/permission.model");
const { UserRole, RolePermission } = require("./joins.model");
const { LAB_ADMIN_DEFAULT_PERMISSIONS } = require("../../../../config/defaultPermissions");

/* -------------------------------------------------- */
/* ASSIGN ROLE → USER                                 */
/* -------------------------------------------------- */
async function assignRoleToUser({userId, roleId }) {
  if (!userId || !roleId) {
    throw new ApiError(400, "userId and roleId required");
  }

  const user = await User.findByPk(userId);
  if (!user) throw new ApiError(404, "User not found");

  const role = await Role.findByPk(roleId);
  if (!role) throw new ApiError(404, "Role not found");

  await UserRole.findOrCreate({
    where: {
      user_id: userId,
      role_id: roleId,
    },
    defaults: {
      user_id: userId,
      role_id: roleId,
      is_active: true,
    },
  });

  return { userId, roleId };
}

async function attachDefaultPermissionsToLabAdmin(roleId, transaction) {
  // fetch permission IDs by keys
  const permissions = await Permission.findAll({
    where: { key: LAB_ADMIN_DEFAULT_PERMISSIONS },
    transaction,
  });

  const mappings = permissions.map((p) => ({
    role_id: roleId,
    permission_id: p.id,
  }));

  await RolePermission.bulkCreate(mappings, { transaction });
}

/* -------------------------------------------------- */
/* ATTACH PERMISSION → ROLE                           */
/* -------------------------------------------------- */
async function attachPermissionToRole({ roleId, permissionId }) {
  if (!roleId || !permissionId) {
    throw new ApiError(400, "roleId and permissionId required");
  }

  const role = await Role.findByPk(roleId);
  if (!role) throw new ApiError(404, "Role not found");

  const perm = await Permission.findByPk(permissionId);
  if (!perm) throw new ApiError(404, "Permission not found");

  // snake_case columns
  await RolePermission.findOrCreate({
    where: { role_id: roleId, permission_id: permissionId },
  });

  return { roleId, permissionId };
}

/* -------------------------------------------------- */
/* GET USER EFFECTIVE PERMISSIONS                     */
/* -------------------------------------------------- */
async function getUserEffectivePermissions({ userId }) {
  if (!userId) throw new ApiError(400, "userId required");

  const user = await User.findByPk(userId, {
    include: [
      {
        model: Role,
        include: [
          {
            model: Permission,
            attributes: ["key"],
            through: { attributes: [] },
          },
        ],
        through: { attributes: [] },
      },
    ],
  });

  if (!user) throw new ApiError(404, "User not found");

  const keys = new Set();

  for (const role of user.Roles || []) {
    for (const perm of role.Permissions || []) {
      if (perm.key) keys.add(perm.key);
    }
  }

  return Array.from(keys);
}

module.exports = {
  attachDefaultPermissionsToLabAdmin,
  assignRoleToUser,
  attachPermissionToRole,
  getUserEffectivePermissions,
};
