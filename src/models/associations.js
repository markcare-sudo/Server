const { Blog } = require("../modules/blogs/blog.model");
const AuditLog = require("../modules/control-panel/ima/audit-logs/audit-log.model");
const PlatformFeature = require("../modules/control-panel/ima/platformFeatures/platformFeature.model");
const PlatformModule = require("../modules/control-panel/ima/platformModules/platformModule.model");
const { Keyword } = require("../modules/keywords/keyword.model");
const { Tag } = require("../modules/tags/tag.model");


module.exports = () => {
   /* =========================================================
      IMPORT MODELS
   ========================================================= */
   const { User } = require("../modules/control-panel/ima/users/user.model");
   const { Role } = require("../modules/control-panel/ima/roles/role.model");
   const { Permission } = require("../modules/control-panel/ima/permissions/permission.model");
   const { RolePermission, UserRole } = require("../modules/control-panel/ima/assignments/joins.model");

   const RefreshToken = require("../modules/auth/tokens/refreshToken.model");
   const Otp = require("../modules/auth/otp/otp.model");

   // 1. Tell Sequelize that an AuditLog entry belongs to a User
   AuditLog.belongsTo(User, { foreignKey: "user_id", as: "user" });
   User.hasMany(AuditLog, { foreignKey: "user_id", as: "auditLogs" });

   /* =========================================================
      IAM / RBAC
   ========================================================= */
   Role.belongsToMany(Permission, { through: RolePermission, as: "permissions", foreignKey: "role_id", otherKey: "permission_id", onDelete: "CASCADE", onUpdate: "CASCADE" });
   Permission.belongsToMany(Role, { through: RolePermission, as: "roles", foreignKey: "permission_id", otherKey: "role_id", onDelete: "CASCADE", onUpdate: "CASCADE" });

   /* =========================================================
      MODULE ↔ FEATURE
   ========================================================= */

   PlatformModule.hasMany(PlatformFeature, { foreignKey: "module_id", as: "features", onDelete: "CASCADE", onUpdate: "CASCADE" });
   PlatformFeature.belongsTo(PlatformModule, { foreignKey: "module_id", as: "module" });

   /* =========================================================
   MODULE ↔ PERMISSIONS
   ========================================================= */

   PlatformModule.hasMany(Permission, { foreignKey: "module_id", as: "permissions", onDelete: "CASCADE", onUpdate: "CASCADE" });
   Permission.belongsTo(PlatformModule, { foreignKey: "module_id", as: "module" });

   /* =========================================================
   FEATURE ↔ PERMISSIONS
   ========================================================= */

   PlatformFeature.hasMany(Permission, { foreignKey: "feature_id", as: "permissions", onDelete: "CASCADE", onUpdate: "CASCADE" });
   Permission.belongsTo(PlatformFeature, { foreignKey: "feature_id", as: "feature" });

   User.belongsToMany(Role, { through: UserRole, as: "user_roles", foreignKey: "user_id", otherKey: "role_id" });
   Role.belongsToMany(User, { through: UserRole, as: "users", foreignKey: "role_id", otherKey: "user_id" });

   User.hasMany(UserRole, { foreignKey: "user_id", as: "user_role_assignments" });
   Role.hasMany(UserRole, { foreignKey: "role_id", as: "user_role_assignments" });
   UserRole.belongsTo(User, { foreignKey: "user_id", as: "user" });
   UserRole.belongsTo(Role, { foreignKey: "role_id", as: "role" });

   /* =========================================================
      AUTH
   ========================================================= */
   User.hasMany(RefreshToken, { foreignKey: "user_id", as: "refresh_tokens", onDelete: "CASCADE", onUpdate: "CASCADE" });
   RefreshToken.belongsTo(User, { foreignKey: "user_id", as: "user" });

   User.hasMany(Otp, { foreignKey: "user_id", as: "otps", onDelete: "CASCADE", onUpdate: "CASCADE" });
   Otp.belongsTo(User, { foreignKey: "user_id", as: "user" });


   /* =========================================================
         BLOGS - MANY-TO-MANY SETUP (FINALIZED)
      ========================================================= */

   // 1. Blog <-> Tag
   Blog.belongsToMany(Tag, { through: 'blog_tags', as: 'tags', foreignKey: 'blog_id', otherKey: 'tag_id', timestamps: true });
   Tag.belongsToMany(Blog, { through: 'blog_tags', as: 'blogs', foreignKey: 'tag_id', otherKey: 'blog_id', timestamps: true });

   // 2. Blog <-> Keyword
   Blog.belongsToMany(Keyword, { through: 'blog_keywords', as: 'keywords', foreignKey: 'blog_id', otherKey: 'keyword_id', timestamps: true });
   Keyword.belongsToMany(Blog, { through: 'blog_keywords', as: 'blogs', foreignKey: 'keyword_id', otherKey: 'blog_id', timestamps: true });
};