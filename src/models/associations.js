module.exports = (db) => {
  const {
    Tenant,
    SubscriptionPlan,
    TenantSubscription,
    Ratelist,
    RatelistItem,
    Test,
  } = db;

  /* ================= TENANT ↔ SUBSCRIPTION ================= */

  SubscriptionPlan.hasMany(TenantSubscription, { foreignKey: "plan_id" });
  TenantSubscription.belongsTo(SubscriptionPlan, { foreignKey: "plan_id" });

  Tenant.hasMany(TenantSubscription, { foreignKey: "tenant_id" });
  TenantSubscription.belongsTo(Tenant, { foreignKey: "tenant_id" });

  /* ================= RATELIST ================= */

  Ratelist.hasMany(RatelistItem, { foreignKey: "ratelist_id" });
  RatelistItem.belongsTo(Ratelist, { foreignKey: "ratelist_id" });

  /* ================= TEST USAGE ================= */

  Test.hasMany(RatelistItem, { foreignKey: "test_id" });
  RatelistItem.belongsTo(Test, { foreignKey: "test_id" });
};
