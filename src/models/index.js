// src/models/index.js

/* =========================================================
   CONTROL PANEL / MASTER DATA
========================================================= */

// Otp Request 
require("../modules/auth/otp/otp.model");



/* =========================================================
   IAM (Identity & Access Management)
========================================================= */

// Base IAM models
require("../modules/control-panel/ima/users/user.model");
require("../modules/control-panel/ima/roles/role.model");
require("../modules/control-panel/ima/tenant_roles/tenantRole.model");
require("../modules/control-panel/ima/tenant_users/tenantUser.model");
require("../modules/control-panel/ima/permissions/permission.model");

// IAM joins / associations (MUST be after base models)
require("../modules/control-panel/ima/assignments/joins.model");


/* =========================================================
   AUTHENTICATION (OTP + TOKENS)
========================================================= */

// OTP (email / sms / mfa)
require("../modules/auth/otp/otp.model");

require("../modules/blogs/blog.model");
require("../modules/tags/tag.model");
require("../modules/keywords/keyword.model");

require("../modules/callbackRequest/callbackRequest.model");

// Refresh tokens (JWT rotation)
require("../modules/auth/tokens/refreshToken.model");




require("./associations")();