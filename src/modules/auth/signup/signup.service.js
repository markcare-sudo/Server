const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { createOtp, verifyOtp } = require("../otp/otp.service");

const { User } = require("../../control-panel/ima/users/user.model");
// const Tenant = require("../../control-panel/tenants/tenant/tenant.model");
const TenantRole = require("../../control-panel/ima/tenant_roles/tenantRole.model");
const { Role } = require("../../control-panel/ima/roles/role.model");
const TenantUser = require("../../control-panel/ima/tenant_users/tenantUser.model");

const { Op } = require("sequelize");
const ApiError = require("../../../core/errors/ApiError");
const { sequelize } = require("../../../config/db.js");

const RefreshToken = require("../tokens/refreshToken.model");
const { signAccessToken, makeRefreshTokenValue } = require("../tokens/token.util");
// const TenantSubscription = require("../../control-panel/subscriptions/tenantSubscription/tenantSubscription.model.js");

const REFRESH_DAYS = Number(String(process.env.REFRESH_TOKEN_DAYS || "30").replace(/[^\d]/g, "")) || 30;

const TRIAL_PLAN_ID = 1


function makeExpiryDate(days) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}


async function requestSignupEmailOtp({ name, labName, email, phone, ip, ua }) {
  if (!name || !labName || !email || !phone) {
    throw new ApiError(400, "name, labName, email, phone required");
  }

  const existing = await User.findOne({
    where: { [Op.or]: [{ email }, { phone }] },
  });

  if (existing) throw new ApiError(409, "User already exists. Please login.");

  return createOtp({
    channel: "EMAIL",
    destination: email,
    purpose: "SIGNUP_EMAIL",
    ip,
    ua,
    meta: { name, lab_name: labName, email, phone },
  });
}


async function verifySignupEmailOtp({ requestId, otp, ip = null, ua = null }) {
  if (!requestId || !otp) {
    throw new ApiError(400, "requestId and otp are required");
  }

  /** STEP 1 — Verify EMAIL OTP */
  const otpResult = await verifyOtp({
    requestId,
    otp,
    purpose: "SIGNUP_EMAIL",
  });

  if (!otpResult) {
    throw new ApiError(401, "Invalid or expired EMAIL OTP");
  }

  const { meta } = otpResult;

  if (!meta?.name || !meta?.lab_name || !meta?.email || !meta?.phone) {
    throw new ApiError(400, "Incomplete signup metadata");
  }

  /** STEP 2 — Prevent duplicate signup */
  const existing = await User.findOne({ where: { email: meta.email } });
  if (existing) {
    throw new ApiError(409, "User already exists. Please login.");
  }

  /** STEP 3 — Start transaction */
  const t = await sequelize.transaction();

  try {
    /** STEP 4 — Create Tenant */
    const code = `LAB-${Date.now().toString(36).toUpperCase()}`;

    // const tenant = await Tenant.create(
    //   {
    //     lab_name: meta.lab_name,
    //     display_name: meta.lab_name,
    //     code,
    //     organization_type: "STANDALONE",
    //     status: "ACTIVE",
    //     activated_at: new Date(),
    //   },
    //   { transaction: t }
    // );

    /** STEP 5 — Create Lab Admin User (GLOBAL user, no tenant_id) */
    const user = await User.create(
      {
        name: meta.name,
        email: meta.email,
        phone: meta.phone,
        password_hash: "OTP_AUTH", // will set real password later
        is_active: true,
        is_super_admin: false,
      },
      { transaction: t }
    );

    /** STEP 6 — Get existing global LAB_ADMIN role */
    const labAdminRole = await Role.findOne({
      where: { code: "LAB_ADMIN" },
      transaction: t,
    });

    if (!labAdminRole) {
      throw new Error("LAB_ADMIN role not found. Seed global RBAC first.");
    }

    /** STEP 7 — Enable LAB_ADMIN inside this tenant */
    const tenantRole = await TenantRole.create(
      {
        tenant_id: tenant.id,
        role_id: labAdminRole.id,
      },
      { transaction: t }
    );

    /** STEP 8 — Assign user to tenant as LAB_ADMIN */
    await TenantUser.create(
      {
        user_id: user.id,
        tenant_role_id: tenantRole.id,
        is_active: true,
      },
      { transaction: t }
    );

    /**
     * STEP 9 — (Optional) Create trial subscription
     */
    // await TenantSubscription.create(
    //   {
    //     tenant_id: tenant.id,
    //     plan_id: TRIAL_PLAN_ID,
    //     status: "TRIAL",
    //     start_date: new Date(),
    //     end_date: addDays(new Date(), 14),
    //   },
    //   { transaction: t }
    // );

    /** STEP 10 — Issue Tokens */
    const accessToken = signAccessToken({
      id: user.id,
      tenantId: tenant.id,
    });

    const refreshToken = makeRefreshTokenValue();
    const refreshHash = await bcrypt.hash(refreshToken, 10);

    await RefreshToken.create(
      {
        user_id: user.id,
        token_hash: refreshHash,
        expires_at: makeExpiryDate(REFRESH_DAYS),
        ip_address: ip,
        user_agent: ua,
      },
      { transaction: t }
    );

    /** STEP 11 — Commit */
    await t.commit();

    /** STEP 12 — Return auth response */
    return {
      user: {
        id: user.id,
        tenantId: tenant.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        isSuperAdmin: false,
      },
      accessToken,
      refreshToken,
      isNewUser: true,
    };
  } catch (err) {
    await t.rollback();
    throw err;
  }
}


async function requestSignupPhoneOtp({ signupToken, ip, ua }) {
  const payload = jwt.verify(signupToken, process.env.JWT_SECRET);

  if (payload.stage !== "EMAIL_VERIFIED") {
    throw new ApiError(400, "Email not verified");
  }

  return createOtp({
    channel: "SMS",
    destination: payload.phone,
    purpose: "SIGNUP_PHONE",
    ip,
    ua,
    meta: payload,
  });
}


async function verifySignupPhoneOtpAndCreateTenant({ requestId, otp, ip = null, ua = null }) {
  const otpResult = await verifyOtp({ requestId, otp, purpose: "SIGNUP_PHONE" });
  if (!otpResult) throw new ApiError(401, "Invalid or expired PHONE OTP");

  const { meta } = otpResult;

  /** STEP 1 — Create Tenant */
  const code = `LAB-${Date.now().toString(36).toUpperCase()}`;

  const tenant = await Tenant.create({
    lab_name: meta.lab_name,
    display_name: meta.lab_name,
    code,
    organization_type: "STANDALONE",
    status: "ACTIVE",
    activated_at: new Date(),
  });

  /** STEP 2 — Create Lab Admin */
  const user = await User.create({
    tenant_id: tenant.id,
    name: meta.name,
    email: meta.email,
    phone: meta.phone,
    password_hash: "OTP_AUTH",
    is_active: true,
    is_super_admin: false,
  });

  /** STEP 3 — RBAC bootstrap (later) */
  // await assignLabAdminRole({ userId: user.id, tenantId: tenant.id });

  return issueTokensForUser(user, { ip, ua, isNewUser: true });
}


module.exports = {
  requestSignupEmailOtp,
  verifySignupEmailOtp,
  requestSignupPhoneOtp,
  verifySignupPhoneOtpAndCreateTenant,
}