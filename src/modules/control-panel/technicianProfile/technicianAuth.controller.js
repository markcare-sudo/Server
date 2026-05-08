// technicianAuth.controller.js

const asyncHandler = require("../../../utils/asyncHandler");
const { ok } = require("../../../utils/apiResponse");

const TechnicianAuthService = require("./technicianAuth.service");

// =====================================
// SEND REGISTER OTP
// =====================================
exports.sendRegisterOtp = asyncHandler(async (req, res) => {

    const result =
        await TechnicianAuthService.sendRegisterOtp(
            req.body,
            req
        );

    return ok(res, {
        message: "Registration OTP sent successfully",
        data: result,
    });
});

// =====================================
// VERIFY REGISTER OTP
// =====================================
exports.verifyRegisterOtp = asyncHandler(async (req, res) => {

    const result =
        await TechnicianAuthService.verifyRegisterOtp(
            req.body
        );

    return ok(res, {
        message: "Technician registered successfully",
        data: result,
    });
});

// =====================================
// SEND LOGIN OTP
// =====================================
exports.sendLoginOtp = asyncHandler(async (req, res) => {

    const result =
        await TechnicianAuthService.sendLoginOtp(
            req.body,
            req
        );

    return ok(res, {
        message: "Login OTP sent successfully",
        data: result,
    });
});

// =====================================
// VERIFY LOGIN OTP
// =====================================
exports.verifyLoginOtp = asyncHandler(async (req, res) => {

    const result =
        await TechnicianAuthService.verifyLoginOtp(
            req.body
        );

    return ok(res, {
        message: "Login successful",
        data: result,
    });
});

// =====================================
// GET ALL PROFILES
// =====================================
exports.getProfiles = asyncHandler(async (req, res) => {

    const result =
        await TechnicianAuthService.getProfiles();

    return ok(res, {
        message: "Profiles fetched successfully",
        data: result,
    });
});

// =====================================
// GET PROFILE
// =====================================
exports.getProfile = asyncHandler(async (req, res) => {

    const result =
        await TechnicianAuthService.getProfile(
            req.user.id
        );

    return ok(res, {
        message: "Profile fetched successfully",
        data: result,
    });
});

// =====================================
// UPDATE PROFILE
// =====================================
exports.updateProfile = asyncHandler(async (req, res) => {

    const result =
        await TechnicianAuthService.updateProfile(
            req.user.id,
            req.body
        );

    return ok(res, {
        message: "Profile updated successfully",
        data: result,
    });
});