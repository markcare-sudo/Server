/* modules/iam/auditLogs/auditLog.service.js */
const AuditLog = require("./audit-log.model");
const ApiError = require("../../../../core/errors/ApiError");
const { User } = require("../users/user.model");

/**
 * Create a new audit log entry
 */
async function createLog(data) {
  const {
    user_id, action, module,
    entity_id, old_values, new_values,
    description, ip_address, user_agent
  } = data;

  if (!action || !module) {
    throw new ApiError(400, "Action and Module are required for logging");
  }

  return AuditLog.create({
    user_id,
    action,
    module,
    entity_id,
    old_values,
    new_values,
    description,
    ip_address,
    user_agent,
  });
}

/**
 * List audit logs with tenant filtering
 */
async function listLogs() {
  const where = {};

  return AuditLog.findAll({
    where,
    order: [["created_at", "DESC"]],
    limit: 500,
    // --- THIS IS THE KEY PART ---
    include: [
      {
        model: User,
        as: "user", // Ensure this alias matches your model association
        attributes: ["id", "name", "email"], // Only get what you need
      }
    ],
  });
}

/**
 * Get logs for a specific entity (e.g., all changes to a specific Invoice)
 */
async function getEntityHistory(module, entityId) {
  return AuditLog.findAll({
    where: { module, entity_id: entityId },
    order: [["created_at", "DESC"]],
  });
}

module.exports = { createLog, listLogs, getEntityHistory };