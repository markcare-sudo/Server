const AddressService = require("./address.service");
const { ok, created } = require("../../../utils/apiResponse");
const asyncHandler = require("../../../utils/asyncHandler");

const list = asyncHandler(async (req, res) => {
    const addresses = await AddressService.listUserAddresses(req.user.id);
    return ok(res, addresses || []);
});

const create = asyncHandler(async (req, res) => {
    const address = await AddressService.createAddress(req.user.id, req.body);
    return created(res, address, "Address created successfully");
});

const update = asyncHandler(async (req, res) => {
    const address = await AddressService.updateAddress(
        req.params.id,
        req.user.id,
        req.body
    );
    return ok(res, address, "Address updated successfully");
});

const remove = asyncHandler(async (req, res) => {
    await AddressService.deleteAddress(req.params.id, req.user.id);
    return ok(res, null, "Address removed successfully");
});

module.exports = { list, create, update, remove };