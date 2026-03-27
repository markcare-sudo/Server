// /* modules/auth/auth.service.js */
// const bcrypt = require("bcryptjs");
// const { createOtp, verifyOtp } = require("./otp/otp.service");
// const ApiError = require("../../core/errors/ApiError");
// const { User } = require("../control-panel/ima/users/user.model");
// const { Role } = require("../control-panel/ima/roles/role.model");
// const { UserRole } = require("../control-panel/ima/assignments/joins.model");
// const { signAccessToken, makeRefreshTokenValue } = require("./tokens/token.util");
// const RefreshToken = require("./tokens/refreshToken.model");
// const { sequelize } = require("../../config/db");
// const { Op } = require("sequelize");
// const { log } = require("../../utils/auditLogger");

// const REFRESH_DAYS = Number(process.env.REFRESH_TOKEN_DAYS) || 30;

// async function requestLoginSignupOtp({ identifier, channel = "EMAIL", ip, ua }) {
//   if (!identifier) throw new ApiError(400, "Email or Phone is required");

//   const otpRequest = await createOtp({
//     channel,
//     destination: identifier,
//     purpose: "AUTH_OTP",
//     ip,
//     ua,
//     meta: { identifier },
//   });

//   // Log the OTP Request
//   await log({
//     action: "OTP_REQUESTED",
//     module: "AUTH",
//     description: `OTP requested via ${channel} for ${identifier}`,
//     ip,
//     ua
//   });

//   return otpRequest;
// }

// async function verifyOtpAndAuth({ requestId, otp, name, ip, ua }) {
//   if (!requestId || !otp) throw new ApiError(400, "requestId and otp required");

//   const otpResult = await verifyOtp({ requestId, otp, purpose: "AUTH_OTP" });
//   if (!otpResult) throw new ApiError(401, "Invalid or expired OTP");

//   const identifier = otpResult.destination;
//   const t = await sequelize.transaction();

//   try {
//     let user = await User.findOne({
//       where: { [Op.or]: [{ email: identifier }, { phone: identifier }] },
//       include: [{
//         model: Role,
//         as: 'user_roles', // Match the alias from your associations
//         through: { attributes: [] }
//       }],
//       transaction: t,
//     });

//     let isNewUser = false;

//     if (!user) {
//       isNewUser = true;
//       user = await User.create({
//         name: name || "New User",
//         email: identifier.includes("@") ? identifier : null,
//         phone: !identifier.includes("@") ? identifier : null,
//         is_active: true,
//       }, { transaction: t });

//       const customerRole = await Role.findOne({
//         where: { code: "CUSTOMER" },
//         transaction: t
//       });

//       if (!customerRole) throw new Error("Default CUSTOMER role not found.");

//       await UserRole.create({
//         user_id: user.id,
//         role_id: customerRole.id,
//       }, { transaction: t });

//       // FIX: Attach using the alias 'user_roles' so issueTokens finds it
//       user.user_roles = [customerRole];
//     }

//     const authData = await issueTokens(user, { ip, ua, transaction: t });
//     await t.commit();

//     // Log Successful Login
//     await log({
//       userId: user.id,
//       action: "LOGIN_SUCCESS",
//       module: "AUTH",
//       description: `User logged in successfully (${identifier})`,
//       ip,
//       ua
//     });

//     return { ...authData, isNewUser };
//   } catch (error) {
//     await t.rollback();
//     throw error;
//   }
// }

// async function issueTokens(user, { ip, ua, transaction }) {
//   // Use the correct alias 'user_roles'
//   const roles = user.user_roles || [];
//   const roleIds = roles.map(r => r.id);

//   const accessToken = signAccessToken({
//     id: user.id,
//     roleIds: roleIds,
//   });

//   const refreshToken = makeRefreshTokenValue();
//   const refreshHash = await bcrypt.hash(refreshToken, 10);

//   await RefreshToken.create({
//     user_id: user.id,
//     token_hash: refreshHash,
//     expires_at: new Date(Date.now() + REFRESH_DAYS * 24 * 60 * 60 * 1000),
//     ip_address: ip,
//     user_agent: ua,
//   }, { transaction });

//   return {
//     user: {
//       id: user.id,
//       name: user.name,
//       email: user.email,
//       is_super_admin: user.is_super_admin,
//       is_platform_user: user.user_type === 'PLATFORM_USER' ? true : false,
//       roleIds: roleIds,
//     },
//     accessToken,
//     refreshToken,
//   };
// }

// module.exports = { requestLoginSignupOtp, verifyOtpAndAuth };


/* modules/auth/auth.service.js */

const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { createOtp, verifyOtp } = require("./otp/otp.service");
const ApiError = require("../../core/errors/ApiError");
const { User } = require("../control-panel/ima/users/user.model");
const { Role } = require("../control-panel/ima/roles/role.model");
const { UserRole } = require("../control-panel/ima/assignments/joins.model");
const { signAccessToken } = require("./tokens/token.util");
const RefreshToken = require("./tokens/refreshToken.model");
const { sequelize } = require("../../config/db");
const { Op } = require("sequelize");
const { log } = require("../../utils/auditLogger");

const REFRESH_DAYS = Number(process.env.REFRESH_TOKEN_DAYS) || 30;

//
// ✅ GENERATE REFRESH TOKEN
//
function makeRefreshTokenValue() {
  return crypto.randomBytes(40).toString("hex");
}

//
// ✅ REQUEST OTP
//
async function requestLoginSignupOtp({ identifier, channel = "EMAIL", ip, ua }) {
  if (!identifier) throw new ApiError(400, "Email or Phone is required");

  const otpRequest = await createOtp({
    channel,
    destination: identifier,
    purpose: "AUTH_OTP",
    ip,
    ua,
    meta: { identifier },
  });

  await log({
    action: "OTP_REQUESTED",
    module: "AUTH",
    description: `OTP requested via ${channel} for ${identifier}`,
    ip,
    ua
  });

  return otpRequest;
}

//
// ✅ VERIFY OTP + LOGIN / SIGNUP
//
async function verifyOtpAndAuth({ requestId, otp, name, ip, ua }) {
  if (!requestId || !otp) {
    throw new ApiError(400, "requestId and otp required");
  }

  const otpResult = await verifyOtp({ requestId, otp, purpose: "AUTH_OTP" });
  if (!otpResult) {
    throw new ApiError(401, "Invalid or expired OTP");
  }

  const identifier = otpResult.destination;
  const t = await sequelize.transaction();

  try {
    let user = await User.findOne({
      where: {
        [Op.or]: [{ email: identifier }, { phone: identifier }]
      },
      transaction: t,
    });

    user.update({
      is_email_verified: true,
      // is_phone_verified: true,
    }, { transaction: t });

    let isNewUser = false;

    // ✅ CREATE USER IF NOT EXISTS
    if (!user) {
      isNewUser = true;

      user = await User.create({
        name: name || "New User",
        email: identifier.includes("@") ? identifier : null,
        phone: !identifier.includes("@") ? identifier : null,
        is_email_verified: true,
        // is_phone_verified: true,
        is_active: true,
      }, { transaction: t });

      const customerRole = await Role.findOne({
        where: { code: "CUSTOMER" },
        transaction: t
      });

      if (!customerRole) {
        throw new Error("CUSTOMER role not found");
      }

      await UserRole.create({
        user_id: user.id,
        role_id: customerRole.id,
      }, { transaction: t });
    }

    // ✅ RELOAD USER WITH ROLES
    user = await User.findOne({
      where: { id: user.id },
      include: [{
        model: Role,
        as: "user_roles",
        attributes: ["id", "code"],
        through: { attributes: [] }
      }],
      transaction: t,
    });

    // ✅ ISSUE TOKENS
    const authData = await issueTokens(user, { ip, ua, transaction: t });

    await t.commit();

    await log({
      userId: user.id,
      action: "LOGIN_SUCCESS",
      module: "AUTH",
      description: `User logged in successfully (${identifier})`,
      ip,
      ua
    });

    return { ...authData, isNewUser };

  } catch (error) {
    await t.rollback();
    console.error("AUTH ERROR:", error);
    throw error;
  }
}

//
// ✅ ISSUE TOKENS
//
async function issueTokens(user, { ip, ua, transaction }) {

  const userId = Number(user.id);
  const roles = Array.isArray(user.user_roles) ? user.user_roles : [];
  const roleIds = roles.map(r => Number(r.id));

  //
  // ✅ ACCESS TOKEN (FIXED FOR RBAC)
  //
  const accessToken = signAccessToken({
    id: userId,
    sub: userId,
    roleIds,
    is_super_admin: Boolean(user.is_super_admin), // 🔥 FIXED KEY
    is_platform_user: user.user_type === "PLATFORM",
    name: user.name,
    email: user.email,
    phone: user.phone ?? null,
  });

  //
  // ✅ REFRESH TOKEN
  //
  const refreshToken = makeRefreshTokenValue();

  const refreshHash = await bcrypt.hash(refreshToken, 10);

  await RefreshToken.create({
    user_id: userId,
    token_hash: refreshHash,
    expires_at: new Date(Date.now() + REFRESH_DAYS * 86400000),
    ip_address: ip,
    user_agent: ua,
  }, { transaction });

  //
  // ✅ FINAL RESPONSE
  //
  return {
    user: {
      id: userId,
      name: user.name,
      email: user.email,
      phone: user.phone ?? null,
      is_super_admin: Boolean(user.is_super_admin),
      is_platform_user: user.user_type === "PLATFORM", // 🔥 FIXED
      roleIds,
    },
    accessToken,
    refreshToken,
  };
}

module.exports = {
  requestLoginSignupOtp,
  verifyOtpAndAuth,
};