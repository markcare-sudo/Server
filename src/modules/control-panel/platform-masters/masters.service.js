// src/modules/.../masters/masters.service.js
const { Op } = require("sequelize");
const ApiError = require("../../../core/errors/ApiError");
const { Master } = require("./masters.model");

async function createMaster({ tenantId, data }) {
  const exists = await Master.findOne({ where: { tenantId, type: data.type, code: data.code } });
  if (exists) throw new ApiError(409, "Master already exists for this type + code");

  return Master.create({ tenantId, ...data });
}

async function listMasters({ tenantId, type, page, limit, search, isActive }) {
  const where = { tenantId };

  if (type) where.type = type;

  // ✅ default show only active unless explicitly asked
  if (isActive === null) where.isActive = true;
  else where.isActive = isActive;

  if (search) {
    where[Op.or] = [
      { code: { [Op.like]: `%${search}%` } },
      { name: { [Op.like]: `%${search}%` } },
      { type: { [Op.like]: `%${search}%` } },
    ];
  }

  const offset = (page - 1) * limit;

  const { rows, count } = await Master.findAndCountAll({
    where,
    order: [["id", "DESC"]],
    offset,
    limit,
  });

  return { items: rows, page, limit, total: count, pages: Math.ceil(count / limit) };
}

async function getMaster({ tenantId, id }) {
  const row = await Master.findOne({ where: { tenantId, id } });
  if (!row) throw new ApiError(404, "Master not found");
  return row;
}

async function updateMaster({ tenantId, id, patch }) {
  const row = await getMaster({ tenantId, id });

  // If changing type/code, check uniqueness
  const nextType = patch.type ?? row.type;
  const nextCode = patch.code ?? row.code;

  if (nextType !== row.type || nextCode !== row.code) {
    const dup = await Master.findOne({
      where: { tenantId, type: nextType, code: nextCode, id: { [Op.ne]: id } },
    });
    if (dup) throw new ApiError(409, "Master already exists for this type + code");
  }

  await row.update(patch);
  return row;
}

async function toggleMasterStatus({ tenantId, id, userId }) {
  const row = await getMaster({ tenantId, id });

  const nextActive = !row.isActive;

  await row.update({
    isActive: nextActive,
    deletedAt: nextActive ? null : new Date(),
    deletedBy: nextActive ? null : (userId || null),
  });

  return row;
}

module.exports = { createMaster, listMasters, getMaster, updateMaster, toggleMasterStatus };
