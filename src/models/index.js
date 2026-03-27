// src/models/index.js

/* =========================================================
   BASE MODELS
========================================================= */
require("../modules/control-panel/ima/users/user.model");
require("../modules/control-panel/ima/roles/role.model");
require("../modules/control-panel/ima/permissions/permission.model");

require("../modules/blogs/blog.model");
require("../modules/tags/tag.model");
require("../modules/keywords/keyword.model");

/* =========================================================
   JUNCTION / JOIN MODELS (Load these before associations)
========================================================= */
require("../modules/control-panel/ima/assignments/joins.model"); // RolePermission, UserRole
require("../modules/blogs/blogTag.model");     // BlogTag
require("../modules/blogs/blogKeyword.model"); // BlogKeyword

/* =========================================================
   OTHERS
========================================================= */
require("../modules/auth/otp/otp.model");
require("../modules/auth/tokens/refreshToken.model");
require("../modules/callbackRequest/callbackRequest.model");

// Configarations
require("../modules/control-panel/ima/platformModules/platformModule.model");
require("../modules/control-panel/ima/platformFeatures/platformFeature.model");
require("../modules/control-panel/ima/audit-logs/audit-log.model");

// E-Commerce
require("../modules/control-panel/brands/brand.model");
require("../modules/control-panel/categories/category.model");
require("../modules/control-panel/products/product.model");

/* =========================================================
   INITIALIZE ALL LINKS
========================================================= */
require("./associations")();