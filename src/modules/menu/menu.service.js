// modules/menu/menu.service.js

const { PlatformModule, PlatformFeature, RolePermission, TenantSubscription, SubscriptionPlanFeature } = require("../../models");

const getUserMenu = async (user) => {
    const { roleId, tenantId, isSuperAdmin: isPlatformAdmin } = user;
    console.log("Generating menu for user:", user);

    // 1️⃣ Get role permissions
    const permissions = await RolePermission.findAll({
        where: { roleId },
        attributes: ["feature_code"],
    });

    const permissionCodes = permissions.map(p => p.feature_code);

    // 2️⃣ If platform user → skip subscription check
    let allowedFeatures = permissionCodes;

    if (!isPlatformAdmin) {
        const subscription = await TenantSubscription.findOne({
            where: { tenantId, status: "ACTIVE" },
        });

        if (!subscription) return [];

        const planFeatures = await SubscriptionPlanFeature.findAll({
            where: { plan_id: subscription.plan_id },
            attributes: ["feature_code"],
        });

        const planFeatureCodes = planFeatures.map(f => f.feature_code);

        // intersect permissions + subscription features
        allowedFeatures = permissionCodes.filter(code =>
            planFeatureCodes.includes(code)
        );
    }

    // 3️⃣ Get modules mapped to allowed features
    const modules = await PlatformModule.findAll({
        include: [
            {
                model: PlatformFeature,
                as: "features",
                where: { code: allowedFeatures },
                attributes: [],
            },
        ],
        attributes: ["name", "icon", "path", "code"],
    });

    return modules.map(module => ({
        label: module.name,
        icon: module.icon,
        path: module.path,
    }));
};

module.exports = {
    getUserMenu,
};