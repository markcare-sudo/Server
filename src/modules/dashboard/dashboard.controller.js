const dashboardService = require("./dashboard.service");

async function getStats(req, res, next) {
  try {

    const tenantId = req.user?.tenant_id || null;

    const stats = await dashboardService.getDashboardStats({
      tenantId
    });

    res.json({
      success: true,
      data: stats
    });

  } catch (err) {
    next(err);
  }
}

module.exports = {
  getStats
};