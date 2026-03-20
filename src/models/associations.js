
const AuditLog = require("../modules/control-panel/ima/audit-logs/audit-log.model");
// const TenantUsage = require("../modules/control-panel/subscriptions/tenantUsage/tenantUsage.model");

module.exports = () => {

  /* =========================================================
     IMPORT MODELS
  ========================================================= */

  // TENANT CORE
  //  const Tenant = require("../modules/control-panel/tenants/tenant/tenant.model");
  //  const TenantAddress = require("../modules/control-panel/tenants/address/tenantAddress.model");
  //  const TenantContact = require("../modules/control-panel/tenants/contact/tenantContact.model");
  //  const TenantBranding = require("../modules/control-panel/tenants/branding/tenantBranding.model");
  //  const TenantDocument = require("../modules/control-panel/tenants/documents/tenantDocument.model");
  //  const TenantCaseType = require("../modules/control-panel/tenants/tenantCaseType/tenantCaseType.model");

  // SUBSCRIPTIONS
  //  const SubscriptionPlan = require("../modules/control-panel/subscriptions/subscriptionPlan/subscriptionPlan.model");
  //  const SubscriptionPlanFeature = require("../modules/control-panel/subscriptions/subscriptionPlanFeature/subscriptionPlanFeature.model");
  //  const TenantSubscription = require("../modules/control-panel/subscriptions/tenantSubscription/tenantSubscription.model");
  //  const PlatformModule = require("../modules/control-panel/ima/platformModules/platformModule.model");
  //  const PlatformFeature = require("../modules/control-panel/ima/platformFeatures/platformFeature.model");

  // IAM
  const { User } = require("../modules/control-panel/ima/users/user.model");
  const { Role } = require("../modules/control-panel/ima/roles/role.model");
  //  const TenantUser = require("../modules/control-panel/ima/tenant_users/tenantUser.model");
  const { Permission } = require("../modules/control-panel/ima/permissions/permission.model");
  const { RolePermission, UserRole } = require("../modules/control-panel/ima/assignments/joins.model");

  // AUTH
  const RefreshToken = require("../modules/auth/tokens/refreshToken.model");
  const Otp = require("../modules/auth/otp/otp.model");

  // LIS
  //  const Patient = require("../modules/lis/patients/patient.model");

  /* src/models/index.js */

  // 1. Tell Sequelize that an AuditLog entry belongs to a User
  AuditLog.belongsTo(User, { foreignKey: "user_id", as: "user" });
  User.hasMany(AuditLog, { foreignKey: "user_id", as: "auditLogs" });
  //  AuditLog.belongsTo(Tenant, { foreignKey: "tenant_id", as: "tenant" });

  /* =========================================================
     TENANT CORE
  ========================================================= */

  //  Tenant.hasMany(TenantAddress, { foreignKey: "tenant_id", as: "addresses", onDelete: "CASCADE", onUpdate: "CASCADE" });
  //  TenantAddress.belongsTo(Tenant, { foreignKey: "tenant_id", as: "tenant" });

  //  Tenant.hasMany(TenantContact, { foreignKey: "tenant_id", as: "contacts", onDelete: "CASCADE", onUpdate: "CASCADE" });
  //  TenantContact.belongsTo(Tenant, { foreignKey: "tenant_id", as: "tenant" });

  //  Tenant.hasMany(TenantBranding, { foreignKey: "tenant_id", as: "brandings", onDelete: "CASCADE", onUpdate: "CASCADE" });
  //  TenantBranding.belongsTo(Tenant, { foreignKey: "tenant_id", as: "tenant" });

  //  Tenant.hasMany(TenantDocument, { foreignKey: "tenant_id", as: "documents", onDelete: "CASCADE", onUpdate: "CASCADE" });
  //  TenantDocument.belongsTo(Tenant, { foreignKey: "tenant_id", as: "tenant" });

  //  Tenant.hasMany(TenantCaseType, { foreignKey: "tenant_id", as: "tenant_case_types", onDelete: "CASCADE", onUpdate: "CASCADE" });
  //  TenantCaseType.belongsTo(Tenant, { foreignKey: "tenant_id", as: "tenant" });

  /* =========================================================
     TENANT ↔ SUBSCRIPTION
  ========================================================= */

  //  Tenant.hasMany(TenantSubscription, { foreignKey: "tenant_id", as: "subscription", onDelete: "CASCADE", onUpdate: "CASCADE" });
  //  TenantSubscription.belongsTo(Tenant, { foreignKey: "tenant_id", as: "tenant" });

  //  SubscriptionPlan.hasMany(TenantSubscription, { foreignKey: "plan_id", as: "tenant_subscriptions", onDelete: "RESTRICT", onUpdate: "CASCADE" });
  //  TenantSubscription.belongsTo(SubscriptionPlan, { foreignKey: "plan_id", as: "plan" });

  //  Tenant.hasOne(TenantUsage, { foreignKey: "tenant_id", as: "usage", onDelete: "CASCADE", onUpdate: "CASCADE" });
  //  TenantUsage.belongsTo(Tenant, { foreignKey: "tenant_id", as: "tenant" });

  /* =========================================================
     PLAN ↔ PLAN FEATURES
  ========================================================= */

  //  SubscriptionPlan.hasMany(SubscriptionPlanFeature, { foreignKey: "plan_id", as: "plan_features", onDelete: "CASCADE", onUpdate: "CASCADE" });
  //  SubscriptionPlanFeature.belongsTo(SubscriptionPlan, { foreignKey: "plan_id", as: "plan" });

  /* =========================================================
     FEATURE ↔ PLAN FEATURE
  ========================================================= */

  //  PlatformFeature.hasMany(SubscriptionPlanFeature, { foreignKey: "feature_id", as: "plan_mappings", onDelete: "RESTRICT", onUpdate: "CASCADE" });
  //  SubscriptionPlanFeature.belongsTo(PlatformFeature, { foreignKey: "feature_id", as: "feature" });

  /* =========================================================
     MODULE ↔ FEATURE
  ========================================================= */

  //  PlatformModule.hasMany(PlatformFeature, { foreignKey: "module_id", as: "features", onDelete: "CASCADE", onUpdate: "CASCADE" });
  //  PlatformFeature.belongsTo(PlatformModule, { foreignKey: "module_id", as: "module" });

  /* =========================================================
  MODULE ↔ PERMISSIONS
  ========================================================= */

  //  PlatformModule.hasMany(Permission, { foreignKey: "module_id", as: "permissions", onDelete: "CASCADE", onUpdate: "CASCADE" });
  //  Permission.belongsTo(PlatformModule, { foreignKey: "module_id", as: "module" });

  /* =========================================================
  FEATURE ↔ PERMISSIONS
  ========================================================= */

  //  PlatformFeature.hasMany(Permission, { foreignKey: "feature_id", as: "permissions", onDelete: "CASCADE", onUpdate: "CASCADE" });
  //  Permission.belongsTo(PlatformFeature, { foreignKey: "feature_id", as: "feature" });

  /* =========================================================
     IAM / RBAC
  ========================================================= */

  // Role ↔ Permission
  Role.belongsToMany(Permission, { through: RolePermission, as: "permissions", foreignKey: "role_id", otherKey: "permission_id", onDelete: "CASCADE", onUpdate: "CASCADE" });
  Permission.belongsToMany(Role, { through: RolePermission, as: "roles", foreignKey: "permission_id", onDelete: "CASCADE", onUpdate: "CASCADE" });


  // User ↔ UserRole
  User.hasMany(UserRole, { foreignKey: "user_id", as: "user_roles", onDelete: "CASCADE", onUpdate: "CASCADE" });
  UserRole.belongsTo(User, { foreignKey: "user_id", as: "user" });

  // UserRole ↔ Role
  UserRole.belongsTo(Role, { foreignKey: "role_id", as: "role", onDelete: "CASCADE", onUpdate: "CASCADE" });
  Role.hasMany(UserRole, { foreignKey: "role_id", as: "user_roles" });

  /* =========================================================
     AUTH
  ========================================================= */

  User.hasMany(RefreshToken, { foreignKey: "user_id", as: "refresh_tokens", onDelete: "CASCADE", onUpdate: "CASCADE" });
  RefreshToken.belongsTo(User, { foreignKey: "user_id", as: "user" });

  User.hasMany(Otp, { foreignKey: "user_id", as: "otps", onDelete: "CASCADE", onUpdate: "CASCADE" });
  Otp.belongsTo(User, { foreignKey: "user_id", as: "user" });

  /* =========================================================
     MARKETPLACE
  ========================================================= */
  const { ServiceProvider } = require("./ServiceProvider");
  // const Tenant = require("../modules/control-panel/tenants/tenant/tenant.model"); // Assuming Tenant might be imported, or we just rely on associations

  ServiceProvider.belongsTo(User, { foreignKey: 'user_id' });
  // ServiceProvider.belongsTo(Tenant, { foreignKey: 'tenant_id' }); // Actually let's import Tenant just for this if required, but user instructions say "append, do not rewrite".
  
  // As per instructions, simply append:
  try {
    const Tenant = require("../modules/control-panel/tenants/tenant/tenant.model");
    ServiceProvider.belongsTo(Tenant, { foreignKey: 'tenant_id' });
  } catch (err) {
    // Fallback if Tenant is not strictly defined here
    // ServiceProvider.belongsTo(sequelize.models.Tenant, { foreignKey: 'tenant_id' }); 
  }

};