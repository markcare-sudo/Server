/* modules/iam/users/user.controller.js */
const UserService = require("./user.service");

async function create(req, res, next) {
  try {
    const user = await UserService.createUser(req.body);
    res.status(201).json({ success: true, data: user });
  } catch (e) {
    next(e);
  }
}

async function list(req, res, next) {
  try {
    const tenantId = req.user.tenantId; // from auth middleware
    const users = await UserService.listUsers({ tenantId });
    res.json({ success: true, data: users });
  } catch (e) {
    next(e);
  }
}

module.exports = { create, list };














// /* src/modules/iam/users/user.controller.js */
// const bcrypt = require("bcryptjs");
// const ApiError = require("../../../core/errors/ApiError");
// const { User } = require("./user.model");

// async function create(req, res, next) {
//   try {
//     // OPTION A (recommended): take tenantId from token (safer for SaaS)
//     // const tenantId = req.user?.tenantId;

//     // OPTION B: take tenantId from body (less safe, but ok for super-admin flows)
//     const { tenantId, name, email, password, branchId } = req.body;

//     if (!tenantId || !name || !email || !password) {
//       throw new ApiError(400, "tenantId, name, email, password required");
//     }

//     // Prevent duplicates inside same tenant
//     const existing = await User.findOne({ where: { tenantId, email } });
//     if (existing) {
//       throw new ApiError(409, "User already exists with this email", { userId: existing.id });
//     }

//     const passwordHash = await bcrypt.hash(password, 10);

//     const user = await User.create({
//       tenantId,
//       name,
//       email,
//       passwordHash,
//       branchId: branchId || null,
//       isActive: true,
//     });

//     // Never return passwordHash
//     const safeUser = user.toJSON();
//     delete safeUser.passwordHash;

//     return res.status(201).json({ success: true, data: safeUser });
//   } catch (e) {
//     next(e);
//   }
// }

// async function list(req, res, next) {
//   try {
//     const tenantId = req.user?.tenantId;
//     if (!tenantId) throw new ApiError(401, "Missing tenant context");

//     const users = await User.findAll({
//       where: { tenantId },
//       order: [["id", "DESC"]],
//       attributes: { exclude: ["passwordHash"] },
//     });

//     return res.json({ success: true, data: users });
//   } catch (e) {
//     next(e);
//   }
// }

// module.exports = { create, list };
