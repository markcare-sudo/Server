// src/modules/iam/tenantRoles/tenantRole.service.js

const ApiError = require("../../../../core/errors/ApiError");
const TenantRole = require("./tenantRole.model");

async function createTenantRole(data) {
  const { tenant_id, role_id } = data;

  if (!tenant_id || !role_id) {
    throw new ApiError(400, "tenant_id and role_id are required");
  }

  return TenantRole.create(data);
}

async function listTenantRoles(tenantId) {
  if (!tenantId) throw new ApiError(400, "tenant_id is required");

  return TenantRole.findAll({
    where: { tenant_id: tenantId },
    order: [["created_at", "DESC"]],
  });
}

async function removeTenantRole(id) {
  const role = await TenantRole.findByPk(id);
  if (!role) throw new ApiError(404, "Tenant role not found");

  await role.destroy();
  return true;
}

module.exports = {
  createTenantRole,
  listTenantRoles,
  removeTenantRole,
};
