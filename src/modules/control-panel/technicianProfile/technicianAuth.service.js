// technicianAuth.service.js

const jwt = require("jsonwebtoken");

const { sequelize } = require("../../../config/db");

const TechnicianProfile = require("./technicianProfile.model");
const ApiError = require("../../../core/errors/ApiError");
const { User } = require("../ima/users/user.model");
const { Role } = require("../ima/roles/role.model");
const { UserRole } = require("../ima/assignments/joins.model");
const { createOtp, verifyOtp } = require("../../auth/otp/otp.service");


// =====================================
// GENERATE JWT
// =====================================
const generateToken = (user) => {
    return jwt.sign(
        {
            id: user.id,
            phone: user.phone,
            user_type: user.user_type,
        },
        process.env.JWT_SECRET,
        {
            expiresIn: process.env.JWT_EXPIRES_IN || "7d",
        }
    );
};

// =====================================
// SEND REGISTER OTP
// =====================================
async function sendRegisterOtp(payload, req) {

    if (!payload.phone) {
        throw new ApiError(400, "Phone is required");
    }

    const existingUser = await User.findOne({
        where: {
            phone: payload.phone,
        },
    });

    if (
        existingUser &&
        existingUser.user_type === "TECHNICIAN"
    ) {
        throw new ApiError(
            400,
            "Technician already exists with this phone"
        );
    }

    return await createOtp({
        channel: "SMS",
        destination: payload.phone,
        purpose: "TECHNICIAN_REGISTER",

        meta: {
            name: payload.name,
            email: payload.email,
            phone: payload.phone,
            bio: payload.bio || null,
            skills: payload.skills || [],
            experience_years:
                payload.experience_years || 0,
            service_area:
                payload.service_area || [],
        },

        ip: req.ip,
        ua: req.headers["user-agent"],
    });
}

// =====================================
// VERIFY REGISTER OTP
// =====================================
async function verifyRegisterOtp(payload) {

    const verifiedOtp = await verifyOtp({
        requestId: payload.request_id,
        otp: payload.otp,
        purpose: "TECHNICIAN_REGISTER",
    });

    const meta = verifiedOtp.meta;

    if (!meta?.phone) {
        throw new ApiError(
            400,
            "Invalid OTP meta data"
        );
    }

    const existingUser = await User.findOne({
        where: {
            phone: meta.phone,
        },
    });

    if (existingUser) {
        throw new ApiError(
            400,
            "User already exists"
        );
    }

    return await sequelize.transaction(async (t) => {

        const user = await User.create(
            {
                name: meta.name,
                email: meta.email,
                phone: meta.phone,

                user_type: "TECHNICIAN",

                is_phone_verified: true,
                is_active: true,
            },
            { transaction: t }
        );

        const technicianRole = await Role.findOne({
            where: {
                code: "TECHNICIAN",
            },
            transaction: t,
        });

        if (!technicianRole) {
            throw new ApiError(
                500,
                "TECHNICIAN role not found"
            );
        }

        await UserRole.create(
            {
                user_id: user.id,
                role_id: technicianRole.id,
            },
            { transaction: t }
        );

        const profile =
            await TechnicianProfile.create(
                {
                    user_id: user.id,

                    bio: meta.bio,

                    skills: meta.skills,

                    experience_years:
                        meta.experience_years,

                    service_area:
                        meta.service_area,

                    status: "PENDING",
                },
                { transaction: t }
            );

        const token = generateToken(user);

        return {
            token,
            user,
            profile,
        };
    });
}

// =====================================
// SEND LOGIN OTP
// =====================================
async function sendLoginOtp(payload, req) {

    if (!payload.phone) {
        throw new ApiError(400, "Phone is required");
    }

    const user = await User.findOne({
        where: {
            phone: payload.phone,
            user_type: "TECHNICIAN",
        },
    });

    if (!user) {
        throw new ApiError(
            404,
            "Technician not found"
        );
    }

    return await createOtp({
        channel: "SMS",
        destination: payload.phone,
        userId: user.id,
        purpose: "TECHNICIAN_LOGIN",

        ip: req.ip,
        ua: req.headers["user-agent"],
    });
}

// =====================================
// VERIFY LOGIN OTP
// =====================================
async function verifyLoginOtp(payload) {

    const verifiedOtp = await verifyOtp({
        requestId: payload.request_id,
        otp: payload.otp,
        purpose: "TECHNICIAN_LOGIN",
    });

    const user = await User.findByPk(
        verifiedOtp.userId
    );

    if (!user) {
        throw new ApiError(
            404,
            "Technician not found"
        );
    }

    if (!user.is_active) {
        throw new ApiError(
            403,
            "Account inactive"
        );
    }

    const profile =
        await TechnicianProfile.findOne({
            where: {
                user_id: user.id,
            },
        });

    const token = generateToken(user);

    return {
        token,
        user,
        profile,
    };
}

// =====================================
// GET ALL PROFILES
// =====================================
async function getProfiles() {

    return await TechnicianProfile.findAll({
        include: [
            {
                model: User,
                as: "user",
                attributes: {
                    exclude: [
                        "password_hash",
                        "verification_token",
                    ],
                },
            },
        ],
        order: [["id", "DESC"]],
    });
}

// =====================================
// GET PROFILE
// =====================================
async function getProfile(user_id) {

    const profile =
        await TechnicianProfile.findOne({
            where: {
                user_id,
            },
            include: [
                {
                    model: User,
                    as: "user",
                    attributes: {
                        exclude: [
                            "password_hash",
                            "verification_token",
                        ],
                    },
                },
            ],
        });

    if (!profile) {
        throw new ApiError(
            404,
            "Profile not found"
        );
    }

    return profile;
}

// =====================================
// UPDATE PROFILE
// =====================================
async function updateProfile(user_id, payload) {

    const profile =
        await TechnicianProfile.findOne({
            where: {
                user_id,
            },
        });

    if (!profile) {
        throw new ApiError(
            404,
            "Profile not found"
        );
    }

    await profile.update({
        bio: payload.bio ?? profile.bio,

        skills:
            payload.skills ??
            profile.skills,

        experience_years:
            payload.experience_years ??
            profile.experience_years,

        service_area:
            payload.service_area ??
            profile.service_area,

        is_available:
            payload.is_available ??
            profile.is_available,

        current_lat:
            payload.current_lat ??
            profile.current_lat,

        current_lng:
            payload.current_lng ??
            profile.current_lng,
    });

    return profile;
}

module.exports = {
    sendRegisterOtp,
    verifyRegisterOtp,

    sendLoginOtp,
    verifyLoginOtp,

    getProfiles,
    getProfile,
    updateProfile,
};