/* modules/iam/roles/role.controller.js */
const RoleService = require("./role.service");

async function create(req, res, next) {
  try {
    const role = await RoleService.createRole(req.body);
    res.status(201).json({ success: true, data: role });
  } catch (e) {
    next(e);
  }
}

async function list(req, res, next) {
  try {
    const roles = await RoleService.listRoles();
    res.json({ success: true, data: roles });
  } catch (e) {
    next(e);
  }
}

module.exports = { create, list };
