const { Blog } = require("../modules/blogs/blog.model");
const { Keyword } = require("../modules/keywords/keyword.model");
const { Tag } = require("../modules/tags/tag.model");

// IMPORT JUNCTION MODELS - Essential for Many-to-Many
const { BlogTag } = require("../modules/blogs/blogTag.model");
const { BlogKeyword } = require("../modules/blogs/blogKeyword.model");

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

   /* =========================================================
      IAM / RBAC
   ========================================================= */
   Role.belongsToMany(Permission, {
      through: RolePermission, as: "permissions",
      foreignKey: "role_id", otherKey: "permission_id",
      onDelete: "CASCADE", onUpdate: "CASCADE"
   });
   Permission.belongsToMany(Role, {
      through: RolePermission, as: "roles",
      foreignKey: "permission_id", otherKey: "role_id",
      onDelete: "CASCADE", onUpdate: "CASCADE"
   });

   User.belongsToMany(Role, { through: UserRole, as: "user_roles", foreignKey: "user_id", otherKey: "role_id" });
   Role.belongsToMany(User, { through: UserRole, as: "users", foreignKey: "role_id", otherKey: "user_id" });

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
         BLOGS - MANY-TO-MANY SETUP (FINALIZED)
      ========================================================= */

   // 1. Blog <-> Tag 
   // We use 'as: "tags"' to match your frontend and service layer
   Blog.belongsToMany(Tag, {
      through: 'blog_tags',
      as: 'tags',           // CRITICAL: This fixes the "Alias Mismatch"
      foreignKey: 'blog_id', // Matches your DB screenshot
      otherKey: 'tag_id',    // Matches your DB screenshot
      timestamps: true
   });

   Tag.belongsToMany(Blog, {
      through: 'blog_tags',
      as: 'blogs',
      foreignKey: 'tag_id',
      otherKey: 'blog_id',
      timestamps: true
   });

   // 2. Blog <-> Keyword
   // We use 'as: "keywords"' to match your frontend and service layer
   Blog.belongsToMany(Keyword, {
      through: 'blog_keywords',
      as: 'keywords',       // CRITICAL: This fixes the "Alias Mismatch"
      foreignKey: 'blog_id',
      otherKey: 'keyword_id',
      timestamps: true
   });

   Keyword.belongsToMany(Blog, {
      through: 'blog_keywords',
      as: 'blogs',
      foreignKey: 'keyword_id',
      otherKey: 'blog_id',
      timestamps: true
   });
};