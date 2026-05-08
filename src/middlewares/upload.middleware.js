const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const folder = req.body.folder || "products";
    const cleanName = file.originalname
      .split(".")[0]
      .replace(/\s+/g, "-")
      .toLowerCase();

    return {
      folder,
      resource_type: "auto",
      public_id: `${Date.now()}-${cleanName}`,
    };
  },
});

// ==============================
// ✅ MULTER INSTANCE
// ==============================
const upload = multer({
  storage,
  limits: {
    fileSize: 20 * 1024 * 1024,
  },
});

const deleteFile = async (publicId) => {
  try {
    if (!publicId) return;

    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: "image", // or "auto" if mixed uploads
    });

    // ✅ Handle edge cases
    if (!["ok", "not found"].includes(result.result)) {
      console.warn("Cloudinary delete unexpected response:", {
        publicId,
        result,
      });
    }

    return result;
  } catch (error) {
    console.error("Cloudinary delete error:", {
      publicId,
      message: error.message,
    });
  }
};

module.exports = { upload, deleteFile };