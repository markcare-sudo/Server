const { ServiceVisit } = require("./serviceVisit.model");
const { Subscription, MaintenancePlan } = require("./maintenance.model");
const ApiError = require("../../../../core/errors/ApiError");

/**
 * Schedule a new visit under a Subscription (AMC/OMC)
 */
async function scheduleSubscriptionVisit(subscriptionId, data) {
    const sub = await Subscription.findByPk(subscriptionId, {
        include: [{ model: MaintenancePlan, as: 'plan' }]
    });

    if (!sub || sub.status !== 'ACTIVE') {
        throw new ApiError(400, "Subscription is not active");
    }

    // Business Rule: Check if user has exceeded allowed visits
    const visitCount = await ServiceVisit.count({
        where: { subscription_id: subscriptionId, status: 'COMPLETED' }
    });

    if (visitCount >= sub.plan.visits_allowed) {
        throw new ApiError(400, "Maximum visits reached for this plan period");
    }

    return await ServiceVisit.create({
        subscription_id: subscriptionId,
        user_id: sub.user_id,
        ...data
    });
}

/**
 * Complete a Visit (Update Status)
 */
async function completeVisit(visitId, feedbackData) {
    const visit = await ServiceVisit.findByPk(visitId);
    if (!visit) throw new ApiError(404, "Visit not found");

    return await visit.update({
        ...feedbackData,
        status: 'COMPLETED'
    });
}

module.exports = { scheduleSubscriptionVisit, completeVisit };