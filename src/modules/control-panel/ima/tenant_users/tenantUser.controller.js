// src/modules/iam/tenantUsers/tenantUser.controller.js

const service = require("./tenantUser.service");

async function create(req, res, next) {
  try {
    const data = await service.addTenantUser(req.body);
    res.status(201).json({ success: true, data });
  } catch (e) {
    next(e);
  }
}

async function list(req, res, next) {
  try {
    const data = await service.listTenantUsers(req.params.tenant_role_id);
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
}

async function remove(req, res, next) {
  try {
    await service.removeTenantUser(req.params.id);
    res.json({ success: true });
  } catch (e) {
    next(e);
  }
}

module.exports = { create, list, remove };
