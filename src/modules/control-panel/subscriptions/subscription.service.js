const { MaintenancePlan, Subscription } = require("./maintenance.model");
const { User } = require("../iam/users/user.model");
const ApiError = require("../../../../core/errors/ApiError");
const { Op } = require("sequelize");

/**
 * Manage Maintenance Plans (Admin)
 */
async function createPlan(data) {
    return await MaintenancePlan.create(data);
}

async function listPlans(query = {}) {
    const { type } = query;
    const where = {};
    if (type) where.plan_type = type;

    return await MaintenancePlan.findAll({ where, order: [['price', 'ASC']] });
}

/**
 * Subscription Logic (Customer/Admin)
 */
async function subscribeUser(userId, planId, data) {
    const plan = await MaintenancePlan.findByPk(planId);
    if (!plan) throw new ApiError(404, "Maintenance Plan not found");

    // Calculate Dates
    const start_date = data.start_date ? new Date(data.start_date) : new Date();
    const end_date = new Date(start_date);
    end_date.setMonth(end_date.getMonth() + plan.duration_months);

    return await Subscription.create({
        user_id: userId,
        plan_id: planId,
        start_date,
        end_date,
        auto_renew: data.auto_renew || false,
        status: "ACTIVE"
    });
}

async function getUserSubscriptions(userId) {
    return await Subscription.findAll({
        where: { user_id: userId },
        include: [{ model: MaintenancePlan, as: 'plan' }],
        order: [['start_date', 'DESC']]
    });
}

/**
 * Admin: List all active subscriptions with User details
 */
async function listAllSubscriptions(query = {}) {
    const { status, search } = query;
    const where = {};
    if (status) where.status = status;

    return await Subscription.findAndCountAll({
        where,
        include: [
            { model: MaintenancePlan, as: 'plan' },
            { model: User, as: 'user', attributes: ['first_name', 'last_name', 'email'] }
        ],
        order: [['created_at', 'DESC']]
    });
}

module.exports = {
    createPlan,
    listPlans,
    subscribeUser,
    getUserSubscriptions,
    listAllSubscriptions
};