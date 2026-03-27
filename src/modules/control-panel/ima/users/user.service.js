const { sequelize } = require("../../../../config/db");
const { User } = require("./user.model");
const { Role } = require("../roles/role.model");
const { UserRole } = require("../assignments/joins.model");
const { log } = require("../../../../utils/auditLogger");
const crypto = require("crypto");
const { sendUserEmailVerificationLink } = require("../../../../core/email/mailer");
const { Op } = require("sequelize");

const USER_ATTRIBUTES = [
  "id", "name", "email", "phone", "user_type",
  "is_super_admin", "is_active", "is_email_verified",
  "is_phone_verified", "created_at", "updated_at"
];

const USER_INCLUDE = [
  {
    model: UserRole,
    as: "user_role_assignments",
    attributes: ["id", "role_id"],
    include: [{ model: Role, as: "role", attributes: ["id", "name", "code"] }],
  }
];

/* ---------------- HELPERS ---------------- */

function formatUser(userInstance) {
  if (!userInstance) return null;

  // Use .get({ plain: true }) to handle both Sequelize instances and raw data
  const userData = userInstance.get ? userInstance.get({ plain: true }) : userInstance;

  userData.user_role = userData.user_roles?.[0] || null;
  userData.role = userData.user_roles?.[0]?.role;

  delete userData.user_roles;

  return userData;
}

/* ---------------- SERVICES ---------------- */

async function listUsers(query) {
  let { search, page = 1, limit = 10, startDate, endDate, status } = query;

  // ✅ Ensure numbers
  page = parseInt(page);
  limit = parseInt(limit);

  const offset = (page - 1) * limit;

  const where = {};

  // ✅ SEARCH (DB safe: LIKE works everywhere)
  if (search) {
    const searchValue = `%${search.toLowerCase()}%`;

    where[Op.or] = [
      sequelize.where(
        sequelize.fn("LOWER", sequelize.col("User.name")),   // ✅ FIX
        { [Op.like]: searchValue }
      ),
      sequelize.where(
        sequelize.fn("LOWER", sequelize.col("User.email")),  // ✅ FIX
        { [Op.like]: searchValue }
      ),
      sequelize.where(
        sequelize.fn("LOWER", sequelize.col("User.phone")),  // ✅ FIX
        { [Op.like]: searchValue }
      ),
    ];
  }

  // ✅ STATUS FILTER
  if (status) {
    if (status === "ACTIVE") where.is_active = true;
    if (status === "INACTIVE") where.is_active = false;
  }

  // ✅ DATE FILTER
  if (startDate || endDate) {
    where.created_at = {};

    if (startDate) {
      where.created_at[Op.gte] = new Date(startDate);
    }

    if (endDate) {
      where.created_at[Op.lte] = new Date(endDate);
    }
  }

  // ✅ FIND + COUNT (for pagination)
  const { rows, count } = await User.findAndCountAll({
    attributes: USER_ATTRIBUTES,
    include: USER_INCLUDE,
    where,
    order: [["created_at", "DESC"]],
    limit,
    offset,
  });

  return {
    data: rows.map(user => formatUser(user)),
    pagination: {
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    },
  };
}

async function getUser(id, rawInstance = false) {
  const user = await User.findByPk(id, {
    attributes: USER_ATTRIBUTES,
    include: USER_INCLUDE,
  });

  if (!user) throw new Error("User not found");
  return rawInstance ? user : formatUser(user);
}

async function createUser(payload) {
  const { name, email, phone, user_type, role_id } = payload;

  return await sequelize.transaction(async (t) => {
    // 1. Validation
    const existingUser = await User.findOne({ where: { email }, transaction: t });
    if (existingUser) throw new Error("Email already registered");

    // 2. Generate Token and Expiry (24 hours from now)
    const verifyToken = crypto.randomBytes(32).toString("hex");
    const expires = new Date();
    expires.setHours(expires.getHours() + 24);

    // 3. Create User
    const user = await User.create({
      name,
      email,
      phone,
      user_type: user_type || "TENANT",
      is_email_verified: false,
      verification_token: verifyToken,
      verification_expires: expires
    }, { transaction: t });

    // 4. Assign Role
    await UserRole.create({
      user_id: user.id,
      role_id: Number(role_id)
    }, { transaction: t });

    // 5. Trigger Email (Fire and forget or handle error)
    try {
      const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verifyToken}`;
      await sendUserEmailVerificationLink({
        to: user.email,
        name: user.name,
        verifyUrl,
      });
    } catch (err) {
      console.error("Email failed to send, but user was created:", err.message);
    }

    return user;
  });
}

async function verifyUserToken(token) {
  return await sequelize.transaction(async (t) => {
    // 1. Find user by token
    const user = await User.findOne({
      where: { verification_token: token },
      transaction: t,
    });

    if (!user) {
      throw new Error("Invalid or expired verification link.");
    }

    // 2. Check Expiry
    if (user.verification_expires && new Date() > user.verification_expires) {
      throw new Error("This verification link has expired. Please request a new one.");
    }

    // 3. Update Flags
    // If they clicked an email link, we verify email. 
    // Usually, for the first-time setup, we verify both if the link is trusted.
    await user.update({
      is_email_verified: true,
      is_active: true, // Activate user upon verification
      verification_token: null,   // Clear token so it can't be used again
      verification_expires: null  // Clear expiry
    }, { transaction: t });

    // 4. Log the success
    await log({
      action: "VERIFY_EMAIL",
      module: "users",
      userId: user.id,
      description: `User ${user.email} successfully verified their email.`
    });

    return { message: "Account verified successfully!", email: user.email };
  });
}

async function updateUser(id, payload) {
  const userInstance = await User.findByPk(id);
  if (!userInstance) throw new Error("User not found");

  return await sequelize.transaction(async (t) => {
    await userInstance.update(payload, { transaction: t });

    const currentUserType = payload.user_type || userInstance.user_type;
    const { role_id } = payload;

    if (currentUserType === "PLATFORM" && role_id) {
      await UserRole.upsert({ user_id: id, role_id }, { transaction: t });
    }

    // --- THE FIX ---
    // Reload to reflect changes in the response
    await userInstance.reload({
      include: USER_INCLUDE,
      transaction: t
    });

    return formatUser(userInstance);
  });
}

async function deleteUser(id) {
  const user = await User.findByPk(id);
  if (!user) throw new Error("User not found");
  await user.destroy();
  await log({ action: "DELETE", module: "users", userId: id, entityId: id, description: `User '${user.email}' soft deleted` });
  return true;
}

async function restoreUser(id) {
  const user = await User.findByPk(id, { paranoid: false });
  if (!user) throw new Error("User not found");
  await user.restore();
  await log({ action: "RESTORE", module: "users", userId: id, entityId: id, description: "User restored" });
  return true;
}

async function permanentDeleteUser(id) {
  const user = await User.findByPk(id, { paranoid: false });
  if (!user) throw new Error("User not found");
  await user.destroy({ force: true });
  await log({ action: "PERMANENT_DELETE", module: "users", userId: id, entityId: id, description: "User permanently deleted" });
  return true;
}

module.exports = {
  listUsers,
  getUser,
  createUser,
  verifyUserToken,
  updateUser,
  deleteUser,
  restoreUser,
  permanentDeleteUser,
};