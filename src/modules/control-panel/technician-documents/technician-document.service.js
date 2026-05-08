const { TechnicianDocument } = require("../../../models");
const { deleteFile } = require("../../../middlewares/upload.middleware");
const ApiError = require("../../../core/errors/ApiError");

async function create(payload, file, user_id) {
    if (!file) {
        throw new ApiError(400, "Document file is required");
    }

    const document = await TechnicianDocument.create({
        technician_id: user_id,
        document_type: payload.document_type,
        document_number: payload.document_number,
        document_url: file.path,
    });

    return document;
}

async function findAll(query) {
    const where = {};

    if (query.technician_id) {
        where.technician_id = query.technician_id;
    }

    if (query.verification_status) {
        where.verification_status = query.verification_status;
    }

    return await TechnicianDocument.findAll({
        where,
        order: [["id", "DESC"]],
    });
}

async function findOne(id) {
    const document = await TechnicianDocument.findByPk(id);

    if (!document) {
        throw new ApiError(404, "Document not found");
    }

    return document;
}

async function update(id, payload, file) {
    const document = await findOne(id);

    if (file) {
        if (document.document_url) {
            const splitUrl = document.document_url.split("/");
            const fileName = splitUrl[splitUrl.length - 1];
            const publicId = `products/${fileName.split(".")[0]}`;

            await deleteFile(publicId);
        }

        document.document_url = file.path;
    }

    if (payload.document_type)
        document.document_type = payload.document_type;

    if (payload.document_number)
        document.document_number = payload.document_number;

    if (payload.verification_status)
        document.verification_status = payload.verification_status;

    if (payload.remarks)
        document.remarks = payload.remarks;

    if (payload.expiry_date)
        document.expiry_date = payload.expiry_date;

    if (payload.verified_by)
        document.verified_by = payload.verified_by;

    if (payload.verification_status === "approved") {
        document.verified_at = new Date();
    }

    await document.save();

    return document;
}

async function remove(id) {
    const document = await findOne(id);

    if (document.document_url) {
        const splitUrl = document.document_url.split("/");
        const fileName = splitUrl[splitUrl.length - 1];
        const publicId = `products/${fileName.split(".")[0]}`;

        await deleteFile(publicId);
    }

    await document.destroy();

    return true;
}

module.exports = {
    create,
    findAll,
    findOne,
    update,
    remove,
};