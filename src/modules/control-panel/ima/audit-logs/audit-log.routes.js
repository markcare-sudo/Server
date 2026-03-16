/* modules/iam/auditLogs/auditLog.routes.js */
const routerAudit = require("express").Router();

const authMiddleware = require("../../../../middlewares/auth.middleware");
const requirePermission = require("../../../../middlewares/rbac.middleware");
const AuditLogController = require("./audit-log.controller");

// List all logs for the tenant
routerAudit.get(
  "/", 
  authMiddleware, 
//   requirePermission("IAM.AUDIT_LOGS.VIEW"), 
  AuditLogController.list
);

// Get history for a specific entity (e.g., /audit-logs/history/BILLING/101)
routerAudit.get(
  "/history/:module/:id", 
  authMiddleware, 
//   requirePermission("IAM.AUDIT_LOGS.VIEW"), 
  AuditLogController.getHistory
);

// Manually create a log entry if needed
routerAudit.post(
  "/", 
  authMiddleware, 
//   requirePermission("IAM.AUDIT_LOGS.CREATE"), 
  AuditLogController.createManualLog
);

module.exports = routerAudit;