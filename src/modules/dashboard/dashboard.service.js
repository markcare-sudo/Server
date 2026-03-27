const { Op } = require("sequelize");

const { User } = require("../control-panel/ima/users/user.model");
const { Role } = require("../control-panel/ima/roles/role.model");
const AuditLog = require("../control-panel/ima/audit-logs/audit-log.model");



async function getDashboardStats({ tenantId }) {
  const whereTenant = tenantId ? { tenant_id: tenantId } : {};
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [
    totalUsers,
    activeUsers,
    inactiveUsers,
    totalTenants,
    activeTenants,
    suspendedTenants,
    totalRoles,
    totalDepartments,
    todayLogins
  ] = await Promise.all([
    /* USERS */
    User.count({ paranoid: false }), // Shows all users including soft-deleted

    User.count({ where: { is_active: true } }),

    User.count({ where: { is_active: false } }),

    /* ROLES */
    Role.count({ where: whereTenant, paranoid: false }),

    /* TODAY LOGIN COUNT */
    AuditLog.count({
      where: {
        action: "LOGIN",
        created_at: {
          [Op.gte]: todayStart
        }
      }
    })
  ]);

  return {
    users: { total: totalUsers, active: activeUsers, inactive: inactiveUsers },
    roles: { total: totalRoles },
    logins: { today: todayLogins },
    revenue: { total: 0, monthly: 0 }
  };
}

module.exports = {
  getDashboardStats
};