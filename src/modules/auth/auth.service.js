// /* modules/auth/auth.service.js */

// const bcrypt = require("bcryptjs");
// const { createOtp, verifyOtp } = require("./otp/otp.service");
// const ApiError = require("../../core/errors/ApiError");
// const { User } = require("../control-panel/ima/users/user.model");
// const { Role } = require("../control-panel/ima/roles/role.model");
// const { signAccessToken, makeRefreshTokenValue } = require("./tokens/token.util");
// const RefreshToken = require("./tokens/refreshToken.model");
// const { sequelize } = require("../../config/db");
// const { Op } = require("sequelize");

// const REFRESH_DAYS = Number(process.env.REFRESH_TOKEN_DAYS) || 30;

// /**
//  * 1. REQUEST OTP
//  * Used for both Signup and Login. If user doesn't exist, we'll handle that in Verify.
//  */
// async function requestLoginSignupOtp({ identifier, channel = "EMAIL", ip, ua }) {
//   if (!identifier) throw new ApiError(400, "Email or Phone is required");

//   // We don't block "not found" here so we don't leak user existence info
//   // and because we want to allow new users to get an OTP for signup.
//   return createOtp({
//     channel, // "EMAIL" or "SMS"
//     destination: identifier,
//     purpose: "AUTH_OTP",
//     ip,
//     ua,
//     meta: { identifier },
//   });
// }

// /**
//  * 2. VERIFY OTP & (LOGIN or SIGNUP)
//  */
// async function verifyOtpAndAuth({ requestId, otp, name, ip, ua }) {
//   if (!requestId || !otp) throw new ApiError(400, "requestId and otp required");

//   // Verify the OTP via your OTP service
//   const otpResult = await verifyOtp({
//     requestId,
//     otp,
//     purpose: "AUTH_OTP",
//   });

//   if (!otpResult) throw new ApiError(401, "Invalid or expired OTP");

//   const identifier = otpResult.destination;

//   // Start transaction to ensure User + Role assignment is atomic
//   const t = await sequelize.transaction();

//   try {
//     let user = await User.findOne({
//       where: { [Op.or]: [{ email: identifier }, { phone: identifier }] },
//       transaction: t,
//     });

//     let isNewUser = false;

//     // SIGNUP LOGIC: Create user if they don't exist
//     if (!user) {
//       isNewUser = true;

//       // Get the default CUSTOMER role
//       const customerRole = await Role.findOne({ where: { code: "CUSTOMER" }, transaction: t });
//       if (!customerRole) throw new Error("Default CUSTOMER role not found.");

//       user = await User.create({
//         name: name || "New User",
//         email: identifier.includes("@") ? identifier : null,
//         phone: !identifier.includes("@") ? identifier : null,
//         role_id: customerRole.id, // Direct role assignment
//         is_active: true,
//       }, { transaction: t });
//     }

//     // LOGIN LOGIC: Issue Tokens
//     const authData = await issueTokens(user, { ip, ua, transaction: t });

//     await t.commit();

//     return {
//       ...authData,
//       isNewUser,
//     };

//   } catch (error) {
//     await t.rollback();
//     throw error;
//   }
// }

// /**
//  * HELPER: Issue Access and Refresh Tokens
//  */
// async function issueTokens(user, { ip, ua, transaction }) {
//   // Access Token includes the user's role
//   const accessToken = signAccessToken({
//     id: user.id,
//     role: user.role_id, // or user.Role.code if joined
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
//       role: user.role_id,
//     },
//     accessToken,
//     refreshToken,
//   };
// }

// module.exports = {
//   requestLoginSignupOtp,
//   verifyOtpAndAuth,
// };








/* modules/auth/auth.service.js */
const bcrypt = require("bcryptjs");
const { createOtp, verifyOtp } = require("./otp/otp.service");
const ApiError = require("../../core/errors/ApiError");
const { User } = require("../control-panel/ima/users/user.model");
const { Role } = require("../control-panel/ima/roles/role.model");
const { UserRole } = require("../control-panel/ima/assignments/joins.model");
const { signAccessToken, makeRefreshTokenValue } = require("./tokens/token.util");
const RefreshToken = require("./tokens/refreshToken.model");
const { sequelize } = require("../../config/db");
const { Op } = require("sequelize");


const REFRESH_DAYS = Number(process.env.REFRESH_TOKEN_DAYS) || 30;

async function requestLoginSignupOtp({ identifier, channel = "EMAIL", ip, ua }) {
  if (!identifier) throw new ApiError(400, "Email or Phone is required");

  return createOtp({
    channel,
    destination: identifier,
    purpose: "AUTH_OTP",
    ip,
    ua,
    meta: { identifier },
  });
}

async function verifyOtpAndAuth({ requestId, otp, name, ip, ua }) {
  if (!requestId || !otp) throw new ApiError(400, "requestId and otp required");

  const otpResult = await verifyOtp({ requestId, otp, purpose: "AUTH_OTP" });
  if (!otpResult) throw new ApiError(401, "Invalid or expired OTP");

  const identifier = otpResult.destination;
  const t = await sequelize.transaction();

  try {
    let user = await User.findOne({
      where: { [Op.or]: [{ email: identifier }, { phone: identifier }] },
      include: [{ model: Role, as: 'user_roles' }], // Fetch roles via junction table
      transaction: t,
    });

    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      // 1. Create the User
      user = await User.create({
        name: name || "New User",
        email: identifier.includes("@") ? identifier : null,
        phone: !identifier.includes("@") ? identifier : null,
        is_active: true,
      }, { transaction: t });

      // 2. Find the CUSTOMER role
      const customerRole = await Role.findOne({ where: { code: "CUSTOMER" }, transaction: t });
      if (!customerRole) throw new Error("Default CUSTOMER role not found.");

      // 3. Create entry in user_role junction table
      await UserRole.create({
        user_id: user.id,
        role_id: customerRole.id,
      }, { transaction: t });

      // Attach role to user object for token generation
      user.roles = [customerRole];
    }

    const authData = await issueTokens(user, { ip, ua, transaction: t });
    await t.commit();

    return { ...authData, isNewUser };
  } catch (error) {
    await t.rollback();
    throw error;
  }
}

async function issueTokens(user, { ip, ua, transaction }) {
  // Extract role codes or IDs for the token
  const roleCodes = user.roles ? user.roles.map(r => r.code) : [];

  const accessToken = signAccessToken({
    id: user.id,
    roles: roleCodes, // Token now carries an array of roles
  });

  const refreshToken = makeRefreshTokenValue();
  const refreshHash = await bcrypt.hash(refreshToken, 10);

  await RefreshToken.create({
    user_id: user.id,
    token_hash: refreshHash,
    expires_at: new Date(Date.now() + REFRESH_DAYS * 24 * 60 * 60 * 1000),
    ip_address: ip,
    user_agent: ua,
  }, { transaction });

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      roles: roleCodes,
    },
    accessToken,
    refreshToken,
  };
}

module.exports = { requestLoginSignupOtp, verifyOtpAndAuth };