// src/modules/.../masters/masters.controller.js
const ApiError = require("../../../core/errors/ApiError");
const { createMaster, listMasters, getMaster, updateMaster, toggleMasterStatus } = require("./masters.service");

function str(v) { return String(v ?? "").trim(); }
function num(v) { const n = Number(v); return Number.isFinite(n) ? n : null; }

function resolveTenantId(req) {
  const tenantId = num(req.user?.tenantId ?? req.user?.tenant_id ?? req.headers["x-tenant-id"] ?? req.body?.tenantId ?? req.query?.tenantId);
  if (!tenantId) throw new ApiError(400, "tenantId is required");
  return tenantId;
}

function validateCreate(body) {
  const type = str(body.type).toUpperCase();
  const code = str(body.code).toUpperCase();
  const name = str(body.name);

  if (!type) throw new ApiError(400, "type is required");
  if (!code) throw new ApiError(400, "code is required");
  if (!name) throw new ApiError(400, "name is required");

  return {
    type,
    code,
    name,
    value: body.value ?? null,
    isActive: body.isActive === undefined ? true : Boolean(body.isActive),
  };
}

function validateUpdate(body) {
  const patch = {};

  if (body.type !== undefined) {
    const type = str(body.type).toUpperCase();
    if (!type) throw new ApiError(400, "type cannot be empty");
    patch.type = type;
  }

  if (body.code !== undefined) {
    const code = str(body.code).toUpperCase();
    if (!code) throw new ApiError(400, "code cannot be empty");
    patch.code = code;
  }

  if (body.name !== undefined) {
    const name = str(body.name);
    if (!name) throw new ApiError(400, "name cannot be empty");
    patch.name = name;
  }

  if (body.value !== undefined) patch.value = body.value ?? null;
  if (body.isActive !== undefined) patch.isActive = Boolean(body.isActive);

  return patch;
}

function validateList(query) {
  const page = Math.max(1, Number(query.page || 1));
  const limit = Math.min(100, Math.max(1, Number(query.limit || 20)));
  const search = str(query.search || "");
  const type = str(query.type || "").toUpperCase() || null;

  // isActive: null => default active only; true/false => explicit
  const isActive = query.isActive === undefined ? null : String(query.isActive) === "true";

  return { page, limit, search: search || null, type, isActive };
}

function idParam(req) {
  const id = Number(req.params.id);
  if (!id) throw new ApiError(400, "Invalid id");
  return id;
}

async function create(req, res, next) {
  try {
    const tenantId = resolveTenantId(req);
    const data = validateCreate(req.body);

    const row = await createMaster({ tenantId, data });

    return res.json({ success: true, message: "Master created", data: row });
  } catch (e) { next(e); }
}

async function list(req, res, next) {
  try {
    const tenantId = resolveTenantId(req);
    const { page, limit, search, type, isActive } = validateList(req.query);

    const result = await listMasters({ tenantId, type, page, limit, search, isActive });

    return res.json({ success: true, message: "Masters fetched", data: result });
  } catch (e) { next(e); }
}

async function get(req, res, next) {
  try {
    const tenantId = resolveTenantId(req);
    const id = idParam(req);

    const row = await getMaster({ tenantId, id });

    return res.json({ success: true, message: "Master fetched", data: row });
  } catch (e) { next(e); }
}

async function update(req, res, next) {
  try {
    const tenantId = resolveTenantId(req);
    const id = idParam(req);
    const patch = validateUpdate(req.body);

    if (Object.keys(patch).length === 0) throw new ApiError(400, "No fields to update");

    const row = await updateMaster({ tenantId, id, patch });

    return res.json({ success: true, message: "Master updated", data: row });
  } catch (e) { next(e); }
}

async function toggleStatus(req, res, next) {
  try {
    const tenantId = resolveTenantId(req);
    const id = idParam(req);
    const userId = req.user?.id || null;

    const row = await toggleMasterStatus({ tenantId, id, userId });

    return res.json({
      success: true,
      message: row.isActive ? "Master restored" : "Master deactivated",
      data: row,
    });
  } catch (e) { next(e); }
}

module.exports = { create, list, get, update, toggleStatus };
