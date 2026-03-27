const router = require("express").Router();
const authMiddleware = require("../../../../middlewares/auth.middleware");

const {
  list,
  getOne,
  create,
  update,
  remove,
  restore,
  permanentDelete,
  verifyEmail,
} = require("./user.controller");

/**
 * PUBLIC ROUTES
 * These must be defined BEFORE authMiddleware
 */
router.get("/verify-email", verifyEmail);

/**
 * PROTECTED ROUTES
 * Base path: /api/v1/control-panel/users
 */
router.use(authMiddleware); // This protects all routes defined below

router.get("/", list);
router.get("/:id", getOne);
router.post("/", create);
router.put("/:id", update);
router.delete("/:id", remove);

/* Restore soft deleted user */
router.put("/:id/restore", restore);

/* Permanent delete from database */
router.delete("/:id/permanent", permanentDelete);

module.exports = router;