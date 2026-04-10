const {
  listModules,
  getModule,
  createModule,
  updateModule,
  deleteModule,
  getModulesFeaturesPermissions,
} = require("./platformModule.service");

/* ---------------- LIST ---------------- */
async function list(req, res, next) {
  try {
    const data = await listModules(req.query);
    return res.json({
      success: true,
      message: "Modules fetched successfully",
      data,
    });
  } catch (e) {
    next(e);
  }
}

async function listModulesFeaturesPermissions(req, res, next) {
  try {
    const data = await getModulesFeaturesPermissions(req.user.roleIds[0], req.user.is_super_admin);
    return res.json({
      success: true,
      message: "Modules, features and permissions fetched successfully",
      data,
    });
  } catch (e) {
    next(e);
  }
}

/* ---------------- GET ONE ---------------- */
async function getOne(req, res, next) {
  try {
    const data = await getModule(req.params.id);
    return res.json({
      success: true,
      message: "Module fetched successfully",
      data,
    });
  } catch (e) {
    next(e);
  }
}

/* ---------------- CREATE ---------------- */
async function create(req, res, next) {
  try {
    const data = await createModule(req.user, req.body);
    return res.status(201).json({
      success: true,
      message: "Module created successfully",
      data,
    });
  } catch (e) {
    next(e);
  }
}

/* ---------------- UPDATE ---------------- */
async function update(req, res, next) {
  try {
    const data = await updateModule(req.user, req.params.id, req.body);
    return res.json({
      success: true,
      message: "Module updated successfully",
      data,
    });
  } catch (e) {
    next(e);
  }
}

/* ---------------- DELETE ---------------- */
async function remove(req, res, next) {
  try {
    await deleteModule(req.user, req.params.id);
    return res.json({
      success: true,
      message: "Module deleted successfully",
    });
  } catch (e) {
    next(e);
  }
}

module.exports = { listModulesFeaturesPermissions, list, getOne, create, update, remove };
