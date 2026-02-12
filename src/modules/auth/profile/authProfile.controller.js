// src/modules/auth/profile/authProfile.controller.js

const { getUserAccessProfile } = require("./authProfile.service");
const ApiError = require("../../../core/errors/ApiError");

async function getMyProfile(req, res, next) {
  try {
    const user = req.user;

    if (!user) throw new ApiError(401, "Unauthorized");

    const access = await getUserAccessProfile(user.id, user.tenantId);

    res.json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        tenantId: user.tenantId,
        branchId: user.branchId || null,
        roles: access.roles,
        permissions: access.permissions,
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getMyProfile };
