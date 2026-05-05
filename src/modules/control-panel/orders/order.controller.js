// order.controller.js
const OrderService = require("./order.service");
const { ok, created } = require("../../../utils/apiResponse");
const asyncHandler = require("../../../utils/asyncHandler");

const create = asyncHandler(async (req, res) => {
    const user_id = req.user.id;

    const data = await OrderService.createOrder(user_id, req.body);
    return created(res, data);
});

const verify = asyncHandler(async (req, res) => {
    const result = await OrderService.verifyPayment(req.body);
    return ok(res, result);
});

const listAll = asyncHandler(async (req, res) => {
    const data = await OrderService.listAllOrders(req.query);
    return ok(res, data);
});

const list = asyncHandler(async (req, res) => {
    const data = await OrderService.listOrders(req.user.id, req.query);
    return ok(res, data);
});

const getDetails = asyncHandler(async (req, res) => {
    const order = await OrderService.getOrderById(
        req.user.id,
        req.params.id
    );
    return ok(res, order);
});

const cancel = asyncHandler(async (req, res) => {
    const order = await OrderService.cancelOrder(
        req.user.id,
        req.params.id
    );
    return ok(res, order);
});

// ADMIN
const updateStatus = asyncHandler(async (req, res) => {
    const order = await OrderService.updateOrderStatus(
        req.params.id,
        req.body.status
    );
    return ok(res, order);
});

const remove = asyncHandler(async (req, res) => {
    await OrderService.deleteOrder(req.params.id);
    return ok(res, { message: "Order deleted successfully" });
});

module.exports = {
    create,
    verify,
    listAll,
    list,
    getDetails,
    cancel,
    updateStatus,
    remove,
};