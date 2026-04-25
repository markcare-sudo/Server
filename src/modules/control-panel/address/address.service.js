const Address = require("./address.model");
const ApiError = require("../../../core/errors/ApiError");
const { sequelize } = require("../../../config/db");

/**
 * Create Address
 */
async function createAddress(userId, data) {
    return await sequelize.transaction(async (t) => {

        // If first address → force default
        const count = await Address.count({ where: { user_id: userId }, transaction: t });

        if (count === 0) {
            data.is_default = true;
        }

        // If setting default → unset others
        if (data.is_default) {
            await Address.update(
                { is_default: false },
                { where: { user_id: userId }, transaction: t }
            );
        }

        return await Address.create(
            { ...data, user_id: userId },
            { transaction: t }
        );
    });
}

/**
 * List Addresses
 */
async function listUserAddresses(userId) {
    return await Address.findAll({
        where: { user_id: userId },
        order: [
            ["is_default", "DESC"],
            ["created_at", "DESC"]
        ]
    });
}

/**
 * Update Address
 */
async function updateAddress(addressId, userId, data) {
    return await sequelize.transaction(async (t) => {

        const address = await Address.findOne({
            where: { id: addressId, user_id: userId },
            transaction: t
        });

        if (!address) throw new ApiError(404, "Address not found");

        // If setting default → unset others
        if (data.is_default) {
            await Address.update(
                { is_default: false },
                { where: { user_id: userId }, transaction: t }
            );
        }

        await address.update(data, { transaction: t });

        return address;
    });
}

/**
 * Delete Address
 */
async function deleteAddress(addressId, userId) {
    return await sequelize.transaction(async (t) => {

        const address = await Address.findOne({
            where: { id: addressId, user_id: userId },
            transaction: t
        });

        if (!address) throw new ApiError(404, "Address not found");

        const wasDefault = address.is_default;

        await address.destroy({ transaction: t });

        // ✅ If default deleted → assign another
        if (wasDefault) {
            const next = await Address.findOne({
                where: { user_id: userId },
                order: [["created_at", "DESC"]],
                transaction: t
            });

            if (next) {
                await next.update({ is_default: true }, { transaction: t });
            }
        }

        return true;
    });
}

module.exports = {
    createAddress,
    listUserAddresses,
    updateAddress,
    deleteAddress
};