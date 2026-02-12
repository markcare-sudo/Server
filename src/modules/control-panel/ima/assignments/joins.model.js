/* src/modules/iam/assignments/joins.model.js
   Join tables + associations (RBAC core)
*/

const { sequelize } = require("../../../../config/db");
const { DataTypes } = require("sequelize");

const { User: U } = require("../users/user.model");
const { Role: R } = require("../roles/role.model");
const { Permission: P } = require("../permissions/permission.model");


// USER <-> ROLE (many-to-many)
const UserRole = sequelize.define(
  "UserRole",
  {
    id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },

    user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    role_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },

    isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  {
    tableName: "user_roles",
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ["user_id", "role_id"],
      },
      { fields: ["user_id"] },
      { fields: ["role_id"] },
    ],
  }
);

// ROLE <-> PERMISSION (many-to-many)
const RolePermission = sequelize.define(
  "RolePermission",
  {
    id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },

    role_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    permission_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },

    isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  {
    tableName: "role_permissions",
    timestamps: true,
    underscored: true,
    paranoid: true,
    indexes: [
      { unique: true, fields: ["role_id", "permission_id"] },
      { fields: ["role_id"] },
      { fields: ["permission_id"] },
    ],
  }
);

// Associations
U.belongsToMany(R, { through: UserRole, foreignKey: "userId", otherKey: "roleId" });
R.belongsToMany(U, { through: UserRole, foreignKey: "roleId", otherKey: "userId" });

R.belongsToMany(P, { through: RolePermission, foreignKey: "roleId", otherKey: "permissionId" });
P.belongsToMany(R, { through: RolePermission, foreignKey: "permissionId", otherKey: "roleId" });

// Optional (handy for debugging/admin screens)
UserRole.belongsTo(U, { foreignKey: "userId" });
UserRole.belongsTo(R, { foreignKey: "roleId" });
RolePermission.belongsTo(R, { foreignKey: "roleId" });
RolePermission.belongsTo(P, { foreignKey: "permissionId" });

module.exports = { UserRole, RolePermission };
