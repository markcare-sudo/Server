// technicianAuth.routes.js

const router = require("express").Router();

const authMiddleware = require("../../../middlewares/auth.middleware");

const TechnicianAuthController = require("./technicianAuth.controller");

// =====================================
// REGISTER
// =====================================

// Send Register OTP
router.post(
    "/register/send-otp",
    TechnicianAuthController.sendRegisterOtp
);

// Verify Register OTP
router.post(
    "/register/verify-otp",
    TechnicianAuthController.verifyRegisterOtp
);

// =====================================
// LOGIN
// =====================================

// Send Login OTP
router.post(
    "/login/send-otp",
    TechnicianAuthController.sendLoginOtp
);

// Verify Login OTP
router.post(
    "/login/verify-otp",
    TechnicianAuthController.verifyLoginOtp
);

// =====================================
// TECHNICIAN PROFILES
// =====================================

// Get All Profiles
router.get(
    "/profiles",
    TechnicianAuthController.getProfiles
);

// Get Logged-in Technician Profile
router.get(
    "/profile",
    authMiddleware,
    TechnicianAuthController.getProfile
);

// Update Logged-in Technician Profile
router.put(
    "/profile",
    authMiddleware,
    TechnicianAuthController.updateProfile
);

module.exports = router;