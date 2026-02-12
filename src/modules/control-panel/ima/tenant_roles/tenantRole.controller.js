// src/modules/iam/tenantRoles/tenantRole.controller.js

const service = require("./tenantRole.service");

async function create(req, res, next) {
  try {
    const data = await service.createTenantRole(req.body);
    res.status(201).json({ success: true, data });
  } catch (e) {
    next(e);
  }
}

async function list(req, res, next) {
  try {
    const data = await service.listTenantRoles(req.params.tenant_id);
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
}

async function remove(req, res, next) {
  try {
    await service.removeTenantRole(req.params.id);
    res.json({ success: true });
  } catch (e) {
    next(e);
  }
}

module.exports = { create, list, remove };
