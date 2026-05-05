// const { Blog } = require("../modules/blogs/blog.model");
// const { Brand } = require("../modules/control-panel/brands/brand.model");
// const { Cart, CartItem } = require("../modules/control-panel/cart/cart.model");
// const { Category } = require("../modules/control-panel/categories/category.model");
// const AuditLog = require("../modules/control-panel/ima/audit-logs/audit-log.model");
// const PlatformFeature = require("../modules/control-panel/ima/platformFeatures/platformFeature.model");
// const PlatformModule = require("../modules/control-panel/ima/platformModules/platformModule.model");
// const { Product, ProductVariant, ProductImage } = require("../modules/control-panel/products/product.model");
// const { Service } = require("../modules/control-panel/service/service.model");
// const { Wishlist, WishlistItem } = require("../modules/control-panel/wishlist/wishlist.model");
// const { Keyword } = require("../modules/keywords/keyword.model");
// const { Tag } = require("../modules/tags/tag.model");


// module.exports = () => {
//    /* =========================================================
//       IMPORT MODELS
//    ========================================================= */
//    const { User } = require("../modules/control-panel/ima/users/user.model");
//    const { Role } = require("../modules/control-panel/ima/roles/role.model");
//    const { Permission } = require("../modules/control-panel/ima/permissions/permission.model");
//    const { RolePermission, UserRole } = require("../modules/control-panel/ima/assignments/joins.model");

//    const RefreshToken = require("../modules/auth/tokens/refreshToken.model");
//    const Otp = require("../modules/auth/otp/otp.model");

//    // 1. Tell Sequelize that an AuditLog entry belongs to a User
//    AuditLog.belongsTo(User, { foreignKey: "user_id", as: "user" });
//    User.hasMany(AuditLog, { foreignKey: "user_id", as: "auditLogs" });

//    /* =========================================================
//       IAM / RBAC
//    ========================================================= */
//    Role.belongsToMany(Permission, { through: RolePermission, as: "permissions", foreignKey: "role_id", otherKey: "permission_id", onDelete: "CASCADE", onUpdate: "CASCADE" });
//    Permission.belongsToMany(Role, { through: RolePermission, as: "roles", foreignKey: "permission_id", otherKey: "role_id", onDelete: "CASCADE", onUpdate: "CASCADE" });

//    /* =========================================================
//       MODULE ↔ FEATURE
//    ========================================================= */

//    PlatformModule.hasMany(PlatformFeature, { foreignKey: "module_id", as: "features", onDelete: "CASCADE", onUpdate: "CASCADE" });
//    PlatformFeature.belongsTo(PlatformModule, { foreignKey: "module_id", as: "module" });


//    /* =========================================================
//    CATEGORY ↔ SERVICE
//    ========================================================= */

//    Category.hasMany(Service, { foreignKey: "category_id", as: "services", onDelete: "CASCADE", onUpdate: "CASCADE" });
//    Service.belongsTo(Category, { foreignKey: "category_id", as: "category" });


//    /* =========================================================
//    CATEGORY ↔ PRODUCT
//    ========================================================= */

//    Category.hasMany(Product, { foreignKey: "category_id", as: "products", onDelete: "CASCADE", onUpdate: "CASCADE" });
//    Product.belongsTo(Category, { foreignKey: "category_id", as: "category" });

//    // Product <-> Brand
//    Brand.hasMany(Product, { foreignKey: "brand_id", as: "products" });
//    Product.belongsTo(Brand, { foreignKey: "brand_id", as: "brand" });

//    // Product <-> Variants
//    Product.hasMany(ProductVariant, { as: "variants", foreignKey: "product_id", onDelete: 'CASCADE' });
//    // FIX: Added { as: "product" } here
//    ProductVariant.belongsTo(Product, { foreignKey: "product_id", as: "product" });

//    // Product/Variant <-> Images
//    Product.hasMany(ProductImage, { as: "images", foreignKey: "product_id", onDelete: 'CASCADE' });
//    ProductVariant.hasMany(ProductImage, { as: "variant_images", foreignKey: "variant_id", onDelete: 'CASCADE' });

//    // FIX: Added aliases for clarity
//    ProductImage.belongsTo(Product, { foreignKey: "product_id", as: "product" });
//    ProductImage.belongsTo(ProductVariant, { foreignKey: "variant_id", as: "variant" });

//    // Wishlist Associations (Crucial for your Wishlist Service)
//    Wishlist.hasMany(WishlistItem, { foreignKey: "wishlist_id", as: "items" });
//    WishlistItem.belongsTo(Wishlist, { foreignKey: "wishlist_id" });

//    WishlistItem.belongsTo(ProductVariant, { foreignKey: "product_variant_id", as: "variant" });

//    /* =========================================================
//    CART ↔ CART ITEM
//    ========================================================= */

//    Cart.hasMany(CartItem, { foreignKey: "cart_id", as: "cate_items", onDelete: "CASCADE", onUpdate: "CASCADE" });
//    CartItem.belongsTo(Cart, { foreignKey: "cart_id", as: "cart" });

//    /* =========================================================
//    CART ITEM ↔ PRODUCT VARIANT
//    ========================================================= */

//    CartItem.belongsTo(ProductVariant, { foreignKey: "product_variant_id", as: "variant", onDelete: "CASCADE", onUpdate: "CASCADE" });
//    ProductVariant.hasMany(CartItem, { foreignKey: "product_variant_id", onDelete: "CASCADE", onUpdate: "CASCADE" });


//    /* =========================================================
//    MODULE ↔ PERMISSIONS
//    ========================================================= */

//    PlatformModule.hasMany(Permission, { foreignKey: "module_id", as: "permissions", onDelete: "CASCADE", onUpdate: "CASCADE" });
//    Permission.belongsTo(PlatformModule, { foreignKey: "module_id", as: "module" });

//    /* =========================================================
//    FEATURE ↔ PERMISSIONS
//    ========================================================= */

//    PlatformFeature.hasMany(Permission, { foreignKey: "feature_id", as: "permissions", onDelete: "CASCADE", onUpdate: "CASCADE" });
//    Permission.belongsTo(PlatformFeature, { foreignKey: "feature_id", as: "feature" });

//    User.belongsToMany(Role, { through: UserRole, as: "user_roles", foreignKey: "user_id", otherKey: "role_id" });
//    Role.belongsToMany(User, { through: UserRole, as: "users", foreignKey: "role_id", otherKey: "user_id" });

//    User.hasMany(UserRole, { foreignKey: "user_id", as: "user_role_assignments" });
//    Role.hasMany(UserRole, { foreignKey: "role_id", as: "user_role_assignments" });
//    UserRole.belongsTo(User, { foreignKey: "user_id", as: "user" });
//    UserRole.belongsTo(Role, { foreignKey: "role_id", as: "role" });

//    /* =========================================================
//       AUTH
//    ========================================================= */
//    User.hasMany(RefreshToken, { foreignKey: "user_id", as: "refresh_tokens", onDelete: "CASCADE", onUpdate: "CASCADE" });
//    RefreshToken.belongsTo(User, { foreignKey: "user_id", as: "user" });

//    User.hasMany(Otp, { foreignKey: "user_id", as: "otps", onDelete: "CASCADE", onUpdate: "CASCADE" });
//    Otp.belongsTo(User, { foreignKey: "user_id", as: "user" });


//    /* =========================================================
//          BLOGS - MANY-TO-MANY SETUP (FINALIZED)
//       ========================================================= */

//    // 1. Blog <-> Tag
//    Blog.belongsToMany(Tag, { through: 'blog_tags', as: 'tags', foreignKey: 'blog_id', otherKey: 'tag_id', timestamps: true });
//    Tag.belongsToMany(Blog, { through: 'blog_tags', as: 'blogs', foreignKey: 'tag_id', otherKey: 'blog_id', timestamps: true });

//    // 2. Blog <-> Keyword
//    Blog.belongsToMany(Keyword, { through: 'blog_keywords', as: 'keywords', foreignKey: 'blog_id', otherKey: 'keyword_id', timestamps: true });
//    Keyword.belongsToMany(Blog, { through: 'blog_keywords', as: 'blogs', foreignKey: 'keyword_id', otherKey: 'blog_id', timestamps: true });
// };











const { Blog } = require("../modules/blogs/blog.model");
const { Brand } = require("../modules/control-panel/brands/brand.model");
const { Cart, CartItem } = require("../modules/control-panel/cart/cart.model");
const { Category } = require("../modules/control-panel/categories/category.model");
const AuditLog = require("../modules/control-panel/ima/audit-logs/audit-log.model");
const PlatformFeature = require("../modules/control-panel/ima/platformFeatures/platformFeature.model");
const PlatformModule = require("../modules/control-panel/ima/platformModules/platformModule.model");
const { Product, ProductVariant, ProductImage } = require("../modules/control-panel/products/product.model");
const { Service } = require("../modules/control-panel/service/service.model");
const { Wishlist, WishlistItem } = require("../modules/control-panel/wishlist/wishlist.model");
const { Keyword } = require("../modules/keywords/keyword.model");
const { Tag } = require("../modules/tags/tag.model");
const { User } = require("../modules/control-panel/ima/users/user.model");
const { Role } = require("../modules/control-panel/ima/roles/role.model");
const { Permission } = require("../modules/control-panel/ima/permissions/permission.model");
const { RolePermission, UserRole } = require("../modules/control-panel/ima/assignments/joins.model");
const RefreshToken = require("../modules/auth/tokens/refreshToken.model");
const Otp = require("../modules/auth/otp/otp.model");
const Address = require("../modules/control-panel/address/address.model");
const Order = require("../modules/control-panel/orders/order.model");
const Payment = require("../modules/control-panel/orders/payment.model");
const OrderItem = require("../modules/control-panel/orders/orderItem.model");

module.exports = () => {

   /* =========================================================
      IAM / RBAC / AUDIT
   ========================================================= */
   // User <-> AuditLog
   User.hasMany(AuditLog, { foreignKey: "user_id", as: "auditLogs" });
   AuditLog.belongsTo(User, { foreignKey: "user_id", as: "user" });

   // Role <-> Permission (Many-to-Many)
   Role.belongsToMany(Permission, { through: RolePermission, as: "permissions", foreignKey: "role_id", otherKey: "permission_id", onDelete: "CASCADE" });
   Permission.belongsToMany(Role, { through: RolePermission, as: "roles", foreignKey: "permission_id", otherKey: "role_id", onDelete: "CASCADE" });

   // User <-> Role (Many-to-Many + Direct Join access)
   User.belongsToMany(Role, { through: UserRole, as: "user_roles", foreignKey: "user_id", otherKey: "role_id" });
   Role.belongsToMany(User, { through: UserRole, as: "users", foreignKey: "role_id", otherKey: "user_id" });

   User.hasMany(UserRole, { foreignKey: "user_id", as: "user_role_assignments" });
   Role.hasMany(UserRole, { foreignKey: "role_id", as: "user_role_assignments" });
   UserRole.belongsTo(User, { foreignKey: "user_id", as: "user" });
   UserRole.belongsTo(Role, { foreignKey: "role_id", as: "role" });

   /* =========================================================
      IMA (MODULES, FEATURES, PERMISSIONS)
   ========================================================= */
   // Module <-> Feature
   PlatformModule.hasMany(PlatformFeature, { foreignKey: "module_id", as: "features", onDelete: "CASCADE" });
   PlatformFeature.belongsTo(PlatformModule, { foreignKey: "module_id", as: "module" });

   // Module <-> Permission
   PlatformModule.hasMany(Permission, { foreignKey: "module_id", as: "permissions", onDelete: "CASCADE" });
   Permission.belongsTo(PlatformModule, { foreignKey: "module_id", as: "module" });

   // Feature <-> Permission
   PlatformFeature.hasMany(Permission, { foreignKey: "feature_id", as: "permissions", onDelete: "CASCADE" });
   Permission.belongsTo(PlatformFeature, { foreignKey: "feature_id", as: "feature" });

   /* =========================================================
      CATALOG (CATEGORY, BRAND, PRODUCT, SERVICE)
   ========================================================= */
   // Category <-> Service
   Category.hasMany(Service, { foreignKey: "category_id", as: "services", onDelete: "CASCADE" });
   Service.belongsTo(Category, { foreignKey: "category_id", as: "category" });

   // Category <-> Product
   Category.hasMany(Product, { foreignKey: "category_id", as: "products", onDelete: "CASCADE" });
   Product.belongsTo(Category, { foreignKey: "category_id", as: "category" });

   // Brand <-> Product
   Brand.hasMany(Product, { foreignKey: "brand_id", as: "products" });
   Product.belongsTo(Brand, { foreignKey: "brand_id", as: "brand" });

   /* =========================================================
      PRODUCT VARIANTS & IMAGES
   ========================================================= */
   // Product <-> ProductVariant
   Product.hasMany(ProductVariant, { as: "variants", foreignKey: "product_id", onDelete: 'CASCADE' });
   ProductVariant.belongsTo(Product, { foreignKey: "product_id", as: "product" });

   // Product/Variant <-> ProductImage
   Product.hasMany(ProductImage, { as: "images", foreignKey: "product_id", onDelete: 'CASCADE' });
   ProductVariant.hasMany(ProductImage, { as: "variant_images", foreignKey: "variant_id", onDelete: 'CASCADE' });

   ProductImage.belongsTo(Product, { foreignKey: "product_id", as: "product" });
   ProductImage.belongsTo(ProductVariant, { foreignKey: "variant_id", as: "variant" });

   /* =========================================================
      WISHLIST
   ========================================================= */
   Wishlist.hasMany(WishlistItem, { foreignKey: "wishlist_id", as: "items", onDelete: "CASCADE" });
   WishlistItem.belongsTo(Wishlist, { foreignKey: "wishlist_id", as: "wishlist" });

   // WishlistItem <-> ProductVariant (Crucial for frontend toggle)
   WishlistItem.belongsTo(ProductVariant, { foreignKey: "product_variant_id", as: "variant" });
   ProductVariant.hasMany(WishlistItem, { foreignKey: "product_variant_id", as: "wishlist_items" });

   /* =========================================================
      CART
   ========================================================= */
   // Cart <-> CartItem
   Cart.hasMany(CartItem, { foreignKey: "cart_id", as: "items", onDelete: "CASCADE" }); // Fixed alias from cate_items to items
   CartItem.belongsTo(Cart, { foreignKey: "cart_id", as: "cart" });

   // CartItem <-> ProductVariant
   CartItem.belongsTo(ProductVariant, { foreignKey: "product_variant_id", as: "variant", onDelete: "CASCADE" });
   ProductVariant.hasMany(CartItem, { foreignKey: "product_variant_id", as: "cart_items", onDelete: "CASCADE" });

   // User <-> Address
   User.hasMany(Address, { foreignKey: "user_id", as: "addresses", onDelete: "CASCADE" }); // Fixed alias from cate_items to items
   Address.belongsTo(User, { foreignKey: "user_id", as: "user" });


   // User <-> Order
   User.hasMany(Order, { foreignKey: "user_id", as: "orders", onDelete: "CASCADE" });
   Order.belongsTo(User, { foreignKey: "user_id", as: "user" });

   // Order <-> Payment
   Order.hasOne(Payment, { foreignKey: "order_id", as: "payment", onDelete: "CASCADE" });
   Payment.belongsTo(Order, { foreignKey: "order_id", as: "order" });

   // Address <-> Order (Order billing/shipping address)
   Address.hasMany(Order, { foreignKey: "billing_address_id", as: "billing_orders" });
   Address.hasMany(Order, { foreignKey: "shipping_address_id", as: "shipping_orders" });

   Order.belongsTo(Address, { foreignKey: "billing_address_id", as: "billing_address" });
   Order.belongsTo(Address, { foreignKey: "shipping_address_id", as: "shipping_address" });

   // Order <-> OrderItem
   Order.hasMany(OrderItem, { foreignKey: "order_id", as: "items", onDelete: "CASCADE" });
   OrderItem.belongsTo(Order, { foreignKey: "order_id", as: "order" });

   // OrderItem <-> ProductVariant
   OrderItem.belongsTo(ProductVariant, { foreignKey: "variant_id", as: "variant" });
   ProductVariant.hasMany(OrderItem, { foreignKey: "variant_id", as: "order_items" });

   // OrderItem <-> Product
   OrderItem.belongsTo(Product, { foreignKey: "product_id", as: "product", onDelete: "CASCADE" });
   Product.hasMany(OrderItem, { foreignKey: "product_id", as: "order_items" });


   /* =========================================================
      AUTH & SECURITY
   ========================================================= */
   User.hasMany(RefreshToken, { foreignKey: "user_id", as: "refresh_tokens", onDelete: "CASCADE" });
   RefreshToken.belongsTo(User, { foreignKey: "user_id", as: "user" });

   User.hasMany(Otp, { foreignKey: "user_id", as: "otps", onDelete: "CASCADE" });
   Otp.belongsTo(User, { foreignKey: "user_id", as: "user" });

   /* =========================================================
      BLOGS & TAXONOMIES
   ========================================================= */
   // Blog <-> Tag (Many-to-Many)
   Blog.belongsToMany(Tag, { through: 'blog_tags', as: 'tags', foreignKey: 'blog_id', otherKey: 'tag_id' });
   Tag.belongsToMany(Blog, { through: 'blog_tags', as: 'blogs', foreignKey: 'tag_id', otherKey: 'blog_id' });

   // Blog <-> Keyword (Many-to-Many)
   Blog.belongsToMany(Keyword, { through: 'blog_keywords', as: 'keywords', foreignKey: 'blog_id', otherKey: 'keyword_id' });
   Keyword.belongsToMany(Blog, { through: 'blog_keywords', as: 'blogs', foreignKey: 'keyword_id', otherKey: 'blog_id' });
};