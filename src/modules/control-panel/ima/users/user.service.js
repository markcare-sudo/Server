/* modules/iam/users/user.service.js */
const bcrypt2 = require("bcryptjs");
const { User: User2 } = require("./user.model");
require("../assignments/joins.model"); // ensure associations loaded

async function createUser(payload) {
  const { tenantId, name, email, password, branchId } = payload;
  if (!tenantId || !name || !email || !password) {
    const err = new Error("tenantId, name, email, password required");
    err.status = 400;
    throw err;
  }

  const passwordHash = await bcrypt2.hash(password, 10);
  const user = await User2.create({
    tenantId,
    name,
    email,
    passwordHash,
    branchId: branchId || null,
    isActive: true,
  });

  return user;
}

async function listUsers({ tenantId }) {
  return User2.findAll({ where: { tenantId }, order: [["id", "DESC"]] });
}

module.exports = { createUser, listUsers };