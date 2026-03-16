const AuditLog = require("../modules/control-panel/ima/audit-logs/audit-log.model");


async function log({
  tenantId = null,
  userId = null,
  action,
  module,
  entityId = null,
  oldValues = null,
  newValues = null,
  description = null,
  ip = null,
  ua = null,
}) {
  try {
    await AuditLog.create({
      tenant_id: tenantId,
      user_id: userId,
      action,
      module,
      entity_id: entityId,
      old_values: oldValues,
      new_values: newValues,
      description,
      ip_address: ip,
      user_agent: ua,
    });
  } catch (err) {
    console.error("Audit log error:", err.message);
  }
}

module.exports = { log };