// src/modules/iam/tenantUsers/tenantUser.service.js

const ApiError = require("../../../../core/errors/ApiError");
const TenantUser = require("./tenantUser.model");

async function addTenantUser(data) {
  const { user_id, tenant_role_id } = data;

  if (!user_id || !tenant_role_id) {
    throw new ApiError(400, "user_id and tenant_role_id are required");
  }

  return TenantUser.create(data);
}

async function listTenantUsers(tenantRoleId) {
  if (!tenantRoleId) throw new ApiError(400, "tenant_role_id is required");

  return TenantUser.findAll({
    where: { tenant_role_id: tenantRoleId },
    order: [["created_at", "DESC"]],
  });
}

async function removeTenantUser(id) {
  const user = await TenantUser.findByPk(id);
  if (!user) throw new ApiError(404, "Tenant user not found");

  await user.destroy();
  return true;
}

module.exports = {
  addTenantUser,
  listTenantUsers,
  removeTenantUser,
};
