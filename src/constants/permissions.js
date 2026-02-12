// src/constants/permissions.js
module.exports = {
  LIS: {
    PATIENTS: {
      VIEW: "lis.patients.view",
      CREATE: "lis.patients.create",
      UPDATE: "lis.patients.update",
      DELETE: "lis.patients.delete",
      MERGE: "lis.patients.merge",
    },
  },
  CONTROL_PLANE: {
    IAM: {
      USERS_VIEW: "cp.iam.users.view",
      USERS_MANAGE: "cp.iam.users.manage",
      ROLES_MANAGE: "cp.iam.roles.manage",
    },
  },
};
