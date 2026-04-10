/* modules/iam/roles/role.controller.js */

const RoleService = require("./role.service");

/**
 * Create role
 */
async function create(req, res, next) {
  try {

    const role = await RoleService.createRole(
      req.user,
      req.body,
    );

    res.status(201).json({
      success: true,
      message: "Role and permissions created successfully",
      data: role,
    });

  } catch (e) {
    next(e);
  }
}

/**
 * Update role
 */
async function update(req, res, next) {
  try {

    const role = await RoleService.updateRole(
      req.user,
      req.params.id,
      req.body,
    );

    res.json({
      success: true,
      message: "Role and permissions updated successfully",
      data: role,
    });

  } catch (e) {
    next(e);
  }
}

/**
 * Soft delete role
 */
async function remove(req, res, next) {
  try {

    await RoleService.deleteRole(
      req.user,
      req.params.id,
    );

    res.json({
      success: true,
      message: "Role deleted successfully",
    });

  } catch (e) {
    next(e);
  }
}


/**
 * Permanent delete role
 */
async function permanentRemove(req, res, next) {
  try {

    await RoleService.permanentDeleteRole(
      req.user,
      req.params.id,
    );

    res.json({
      success: true,
      message: "Role permanently deleted",
    });

  } catch (e) {
    next(e);
  }
}

/**
 * List roles
 */
async function list(req, res, next) {
  try {

    const roles = await RoleService.listRoles(req.query);

    res.json({
      success: true,
      data: roles,
    });

  } catch (e) {
    next(e);
  }
}

async function getOne(req, res, next) {
  try {

    const role = await RoleService.getRole(req.params.id);

    res.json({
      success: true,
      data: role,
    });

  } catch (e) {
    next(e);
  }
}

module.exports = {
  create,
  update,
  getOne,
  list,
  remove,
  permanentRemove,
};