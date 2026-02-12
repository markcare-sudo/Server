// src/modules/auth/profile/authProfile.service.js

const { UserRole } = require("../../control-panel/ima/assignments/joins.model");
const { Permission } = require("../../control-panel/ima/permissions/permission.model");
const { Role } = require("../../control-panel/ima/roles/role.model");


async function getUserAccessProfile(userId, tenantId) {
  if (!userId || !tenantId) {
    throw new Error("userId and tenantId required");
  }

  const userRoles = await UserRole.findAll({
    where: { user_id: userId, tenant_id: tenantId, is_active: true },
    include: [
      {
        model: Role,
        attributes: ["id", "code", "name"],
        include: [
          {
            model: Permission,
            attributes: ["id", "key"],
            through: { attributes: [] },
          },
        ],
      },
    ],
  });

  const roles = userRoles.map(r => r.Role.code);

  const permissions = [
    ...new Set(
      userRoles.flatMap(r =>
        (r.Role?.Permissions || []).map(p => p.key)
      )
    ),
  ];

  return { roles, permissions };
}

module.exports = { getUserAccessProfile };
