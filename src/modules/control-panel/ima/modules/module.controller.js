// src/modules/core/modules/module.controller.js

// const asyncHandler = require("../../../utils/asyncHandler");
// const { ok, created } = require("../../../utils/apiResponse");
const asyncHandler = require("../../../../utils/asyncHandler");
const moduleService = require("./module.service");
const { ok, created } = require("../../../../utils/apiResponse");

// CREATE
exports.create = asyncHandler(async (req, res) => {
    const data = await moduleService.createModule(req.user, req.body);
    return created(res, data, "Module created successfully");
});

// GET ALL
exports.getAll = asyncHandler(async (req, res) => {
    const data = await moduleService.getAllModules(req.query);
    return ok(res, data);
});

// GET TREE (sidebar)
exports.getTree = asyncHandler(async (req, res) => {
    // console.log("req.user.selectedRole.id----->", req.user.selectedRole.id)

    const data = await moduleService.getModuleTree(req.user.roleIds[0]);
    return ok(res, data);
});

// GET BY ID
exports.getById = asyncHandler(async (req, res) => {
    const data = await moduleService.getModuleById(req.params.id);
    return ok(res, data);
});

// UPDATE
exports.update = asyncHandler(async (req, res) => {
    const data = await moduleService.updateModule(req.user, req.params.id, req.body);
    return ok(res, data, "Module updated successfully");
});

// DELETE
exports.remove = asyncHandler(async (req, res) => {
    await moduleService.deleteModule(req.user, req.params.id);
    return ok(res, null, "Module deleted successfully");
});

exports.forceDeleteAll = asyncHandler(async (req, res) => {
    const result = await moduleService.deleteAllModulesPermanently(req.user);

    return ok(res, result, "All modules permanently deleted");
});