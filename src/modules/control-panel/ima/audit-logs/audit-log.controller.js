/* modules/iam/auditLogs/auditLog.controller.js */
const AuditLogService = require("./audit-log.service");

async function list(req, res, next) {
  try {
    // If not super admin, restrict to their tenant_id
    const tenantId = req.isSuperAdmin ? null : req.user.tenantId;
    const logs = await AuditLogService.listLogs(tenantId);
    res.json({ success: true, data: logs });
  } catch (e) {
    next(e);
  }
}

async function getHistory(req, res, next) {
  try {
    const { module, id } = req.params;
    const logs = await AuditLogService.getEntityHistory(module, id);
    res.json({ success: true, data: logs });
  } catch (e) {
    next(e);
  }
}

/**
 * Manual log creation (optional - usually logs are created automatically in other services)
 */
async function createManualLog(req, res, next) {
  try {
    const logData = {
      ...req.body,
      tenant_id: req.user.tenantId,
      user_id: req.user.id,
      ip_address: req.ip || req.connection.remoteAddress,
      user_agent: req.headers["user-agent"],
    };
    const log = await AuditLogService.createLog(logData);
    res.status(201).json({ success: true, data: log });
  } catch (e) {
    next(e);
  }
}

module.exports = { list, getHistory, createManualLog };