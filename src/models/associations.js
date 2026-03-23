
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
   /* =========================================================
      MARKETPLACE
   ========================================================= */
   const { ServiceProvider } = require("./ServiceProvider");
   // const Tenant = require("../modules/control-panel/tenants/tenant/tenant.model"); // Assuming Tenant might be imported, or we just rely on associations

   ServiceProvider.belongsTo(User, { foreignKey: 'user_id' });
   User.hasOne(ServiceProvider, { foreignKey: 'user_id', as: 'providerProfile' });
   // ServiceProvider.belongsTo(Tenant, { foreignKey: 'tenant_id' }); // Actually let's import Tenant just for this if required, but user instructions say "append, do not rewrite".

   // As per instructions, simply append:
   try {
      const Tenant = require("../modules/control-panel/tenants/tenant/tenant.model");
      ServiceProvider.belongsTo(Tenant, { foreignKey: 'tenant_id' });
   } catch (err) {
      // Fallback if Tenant is not strictly defined here
      // ServiceProvider.belongsTo(sequelize.models.Tenant, { foreignKey: 'tenant_id' }); 
   }

   // Availability Relationships
   const { ServiceProviderAvailability } = require("./ServiceProviderAvailability");

   ServiceProvider.hasMany(ServiceProviderAvailability, { foreignKey: 'service_provider_id', as: 'availability' });
   ServiceProviderAvailability.belongsTo(ServiceProvider, { foreignKey: 'service_provider_id', as: 'service_provider' });

   // Services Platform
   const { Service } = require("./Service");
   const { ServiceVariant } = require("./ServiceVariant");

   try {
      const Tenant = require("../modules/control-panel/tenants/tenant/tenant.model");
      Service.belongsTo(Tenant, { foreignKey: 'tenant_id' });
   } catch (e) { }

   Service.hasMany(ServiceVariant, { foreignKey: 'service_id', as: 'variants' });
   ServiceVariant.belongsTo(Service, { foreignKey: 'service_id' });

   // Marketplace / Bookings
   const { Booking } = require("./Booking");
   const { BookingTimeline } = require("./BookingTimeline");

   Booking.belongsTo(User, { foreignKey: 'customer_id', as: 'customer' });
   User.hasMany(Booking, { foreignKey: 'customer_id', as: 'bookings' });

   Booking.belongsTo(ServiceProvider, { foreignKey: 'service_provider_id', as: 'provider' });
   ServiceProvider.hasMany(Booking, { foreignKey: 'service_provider_id', as: 'jobs' });

   Booking.belongsTo(Service, { foreignKey: 'service_id' });
   Service.hasMany(Booking, { foreignKey: 'service_id', as: 'bookings' });

   Booking.belongsTo(ServiceVariant, { foreignKey: 'service_variant_id' });
   Booking.hasMany(BookingTimeline, { foreignKey: 'booking_id', as: 'timeline' });

   // Marketplace / Products
   const { Product } = require("./Product");
   const { ProductVariant } = require("./ProductVariant");

   Product.belongsTo(Tenant, { foreignKey: 'tenant_id' });
   Product.hasMany(ProductVariant, { foreignKey: 'product_id', as: 'variants' });
   ProductVariant.belongsTo(Product, { foreignKey: 'product_id' });

   // Marketplace / Orders
   const { Order } = require("./Order");
   const { OrderItem } = require("./OrderItem");

   Order.belongsTo(User, { foreignKey: 'customer_id', as: 'customer' });
   User.hasMany(Order, { foreignKey: 'customer_id', as: 'orders' });

   Order.belongsTo(Tenant, { foreignKey: 'tenant_id' });
   Order.hasMany(OrderItem, { foreignKey: 'order_id', as: 'items' });
   OrderItem.belongsTo(ProductVariant, { foreignKey: 'product_variant_id', as: 'variant' });

   // Marketplace / Finance
   const { Payment } = require("./Payment");
   const { Wallet } = require("./Wallet");
   const { WalletTransaction } = require("./WalletTransaction");

   Payment.belongsTo(User, { foreignKey: 'user_id' });
   Payment.belongsTo(Tenant, { foreignKey: 'tenant_id' });

   Order.hasOne(Payment, { foreignKey: 'reference_id', constraints: false, scope: { reference_type: 'ORDER' }, as: 'payment' });
   Booking.hasOne(Payment, { foreignKey: 'reference_id', constraints: false, scope: { reference_type: 'BOOKING' }, as: 'payment' });

   Wallet.belongsTo(User, { foreignKey: 'user_id' });
   User.hasOne(Wallet, { foreignKey: 'user_id', as: 'wallet' });
   Wallet.hasMany(WalletTransaction, { foreignKey: 'wallet_id', as: 'transactions' });
   WalletTransaction.belongsTo(Wallet, { foreignKey: 'wallet_id' });

   // Marketplace / Reviews
   const { Review } = require("./Review");

   Review.belongsTo(Tenant, { foreignKey: 'tenant_id' });
   Review.belongsTo(Booking, { foreignKey: 'booking_id' });
   Review.belongsTo(Order, { foreignKey: 'order_id' });
   Review.belongsTo(User, { foreignKey: 'reviewer_id', as: 'reviewer' });
   User.hasMany(Review, { foreignKey: 'reviewer_id', as: 'reviewsGiven' });

   Review.belongsTo(User, { foreignKey: 'reviewee_id', as: 'reviewee' });
   ServiceProvider.hasMany(Review, { foreignKey: 'reviewee_id', as: 'reviewsReceived' });

   Booking.hasOne(Review, { foreignKey: 'booking_id', as: 'review' });

   // Marketplace / Cart
   const { Cart } = require("./Cart");
   Cart.belongsTo(User, { foreignKey: 'user_id' });
   User.hasOne(Cart, { foreignKey: 'user_id' });

   // Marketplace / Promos & Discounts
   const { Coupon } = require("./Coupon");
   const { CouponUsage } = require("./CouponUsage");

   CouponUsage.belongsTo(Coupon, { foreignKey: 'coupon_id' });
   CouponUsage.belongsTo(User, { foreignKey: 'user_id' });
   CouponUsage.belongsTo(Order, { foreignKey: 'order_id' });
   CouponUsage.belongsTo(Booking, { foreignKey: 'booking_id' });

};