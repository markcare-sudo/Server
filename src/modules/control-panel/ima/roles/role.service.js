/* modules/iam/roles/role.service.js */
const { attachPermissionToRole } = require("../assignments/assignment.service");
const { Role } = require("./role.model");

async function seedTenantRBAC({ tenantId, transaction }) {
  if (!tenantId) {
    throw new Error("tenantId is required for RBAC seeding");
  }

  /**
   * STEP 1 — Create only LAB_ADMIN role
   */
  const labAdminRole = await Role.create(
    {
      name: "Lab Admin",
      code: "LAB_ADMIN",
      description: "Full administrative access within this tenant",
      is_system: true, // prevents deletion by Lab Admin (recommended)
    },
    { transaction }
  );

  if (!labAdminRole) {
    throw new Error("LAB_ADMIN role creation failed");
  }

  /**
   * STEP 2 — (Recommended)
   * Attach ALL permissions to LAB_ADMIN
   */
  await attachPermissionToRole({
    roleId: labAdminRole.id,
    permissionId: null, // null or special value to indicate "all permissions"
  });

  /**
   * STEP 3 — Return LAB_ADMIN role ID
   */
  return {
    labAdminRoleId: labAdminRole.id,
    rolesCreated: 1,
  };
}

async function createRole({ name, code, description }) {
  if (!name || !code) {
    const err = new Error("name, code required");
    err.status = 400;
    throw err;
  }
  return Role.create({name, code, description: description || null, is_active: true });
}

async function listRoles() {
  return Role.findAll({ order: [["id", "DESC"]] });
}

module.exports = { createRole, listRoles, seedTenantRBAC };