const asyncHandler = require("../../../utils/asyncHandler");
const { ok } = require("../../../utils/apiResponse");
const TechnicianDocumentService = require("./technician-document.service");

exports.create = asyncHandler(async (req, res) => {
    const result = await TechnicianDocumentService.create(
        req.body,
        req.file,
        req.user.id
    );

    return ok(res, {
        message: "Document uploaded successfully",
        data: result,
    });
});

exports.findAll = asyncHandler(async (req, res) => {
    const result = await TechnicianDocumentService.findAll(req.query);

    return ok(res, {
        message: "Documents fetched successfully",
        data: result,
    });
});

exports.findOne = asyncHandler(async (req, res) => {
    const result = await TechnicianDocumentService.findOne(req.params.id);

    return ok(res, {
        message: "Document fetched successfully",
        data: result,
    });
});

exports.update = asyncHandler(async (req, res) => {
    const result = await TechnicianDocumentService.update(
        req.params.id,
        req.body,
        req.file
    );

    return ok(res, {
        message: "Document updated successfully",
        data: result,
    });
});

exports.remove = asyncHandler(async (req, res) => {
    await TechnicianDocumentService.remove(req.params.id);

    return ok(res, {
        message: "Document deleted successfully",
    });
});