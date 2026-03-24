const Address = require("./address.model");
const ApiError = require("../../../../core/errors/ApiError");
const { sequelize } = require("../../../config/db");

/**
 * Add a new address for a user
 */
async function createAddress(userId, data) {
    return await sequelize.transaction(async (t) => {
        // If this new address is set as default, unset others
        if (data.is_default) {
            await Address.update(
                { is_default: false },
                { where: { user_id: userId }, transaction: t }
            );
        }

        return await Address.create({ ...data, user_id: userId }, { transaction: t });
    });
}

/**
 * List all addresses for a specific user
 */
async function listUserAddresses(userId) {
    return await Address.findAll({
        where: { user_id: userId },
        order: [["is_default", "DESC"], ["created_at", "DESC"]]
    });
}

/**
 * Update an address
 */
async function updateAddress(addressId, userId, data) {
    return await sequelize.transaction(async (t) => {
        const address = await Address.findOne({ where: { id: addressId, user_id: userId } });
        if (!address) throw new ApiError(404, "Address not found");

        if (data.is_default) {
            await Address.update(
                { is_default: false },
                { where: { user_id: userId }, transaction: t }
            );
        }

        return await address.update(data, { transaction: t });
    });
}

/**
 * Delete an address
 */
async function deleteAddress(addressId, userId) {
    const address = await Address.findOne({ where: { id: addressId, user_id: userId } });
    if (!address) throw new ApiError(404, "Address not found");

    return await address.destroy();
}

module.exports = { createAddress, listUserAddresses, updateAddress, deleteAddress };