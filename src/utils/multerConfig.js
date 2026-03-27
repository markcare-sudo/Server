const multer = require("multer");
const path = require("path");
const fs = require("fs");
const ApiError = require("../core/errors/ApiError");
// const ApiError = require("../errors/ApiError");

// Ensure upload directory exists
const uploadDir = path.join(__dirname, "../../../public/uploads/products");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Create a unique filename: timestamp-random-originalName
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        cb(null, `prod-${uniqueSuffix}${ext}`);
    },
});

const fileFilter = (req, file, cb) => {
    // Accept images only
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new ApiError(400, "Only .jpg, .jpeg, .png and .webp formats are allowed!"), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit per file
    },
});

module.exports = upload;