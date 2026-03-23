
const AuditLog = require("../modules/control-panel/ima/audit-logs/audit-log.model");
// const TenantUsage = require("../modules/control-panel/subscriptions/tenantUsage/tenantUsage.model");

module.exports = () => {

   /* =========================================================
      IMPORT MODELS
   ========================================================= */
   // IAM
   const { User } = require("../modules/control-panel/ima/users/user.model");
   const { Role } = require("../modules/control-panel/ima/roles/role.model");
   //  const TenantUser = require("../modules/control-panel/ima/tenant_users/tenantUser.model");
   const { Permission } = require("../modules/control-panel/ima/permissions/permission.model");
   const { RolePermission, UserRole } = require("../modules/control-panel/ima/assignments/joins.model");

   // AUTH
   const RefreshToken = require("../modules/auth/tokens/refreshToken.model");
   const Otp = require("../modules/auth/otp/otp.model");


   /* =========================================================
      IAM / RBAC
   ========================================================= */

   // Role ↔ Permission
   Role.belongsToMany(Permission, { through: RolePermission, as: "permissions", foreignKey: "role_id", otherKey: "permission_id", onDelete: "CASCADE", onUpdate: "CASCADE" });
   Permission.belongsToMany(Role, { through: RolePermission, as: "roles", foreignKey: "permission_id", onDelete: "CASCADE", onUpdate: "CASCADE" });


   /* =========================================================
      IAM / RBAC - Updated 
   ========================================================= */

   // 1. Define the Many-to-Many relationship with your preferred alias
   User.belongsToMany(Role, {
      through: UserRole,
      as: "user_roles",   // <--- This MUST match your query's 'as'
      foreignKey: "user_id",
      otherKey: "role_id"
   });

   Role.belongsToMany(User, {
      through: UserRole,
      as: "users",
      foreignKey: "role_id",
      otherKey: "user_id"
   });

   // 2. Keep the one-to-many links if you use them elsewhere
   User.hasMany(UserRole, { foreignKey: "user_id", as: "user_role_assignments" });
   UserRole.belongsTo(User, { foreignKey: "user_id", as: "user" });

   UserRole.belongsTo(Role, { foreignKey: "role_id", as: "role" });
   Role.hasMany(UserRole, { foreignKey: "role_id", as: "user_role_assignments" });

   /* =========================================================
      AUTH
   ========================================================= */

   User.hasMany(RefreshToken, { foreignKey: "user_id", as: "refresh_tokens", onDelete: "CASCADE", onUpdate: "CASCADE" });
   RefreshToken.belongsTo(User, { foreignKey: "user_id", as: "user" });

   User.hasMany(Otp, { foreignKey: "user_id", as: "otps", onDelete: "CASCADE", onUpdate: "CASCADE" });
   Otp.belongsTo(User, { foreignKey: "user_id", as: "user" });

   /* =========================================================
      LIS
   ========================================================= */
   // User.hasMany(Order, { foreignKey: "user_id", as: "otps", onDelete: "CASCADE", onUpdate: "CASCADE" });
   // Order.belongsTo(User, { foreignKey: "user_id", as: "user" });

};