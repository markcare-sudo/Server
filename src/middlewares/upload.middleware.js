// const multer = require("multer");
// const { CloudinaryStorage } = require("multer-storage-cloudinary");
// const cloudinary = require("../config/cloudinary");
// const slugify = require("slugify");

// const storage = new CloudinaryStorage({
//   cloudinary,
//   params: async (req, file) => {
//     const slug = slugify(req.body.title, {
//       lower: true,
//       strict: true,
//       trim: true,
//     });

//     return {
//       folder: "blogs",
//       public_id: slug,
//       resource_type: "auto",
//       overwrite: true,   // ✅ VERY IMPORTANT
//       invalidate: true,  // ✅ Clear CDN cache
//     };
//   },
// });

// const upload = multer({
//   storage,
//   limits: {
//     fileSize: 20 * 1024 * 1024,
//   },
// });

// module.exports = upload;


const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

// ==============================
// ✅ STORAGE CONFIG (FIXED)
// ==============================
// const storage = new CloudinaryStorage({
//   cloudinary,
//   params: async (req, file) => {
//     const folder = req.body.folder || "services";

//     return {
//       folder,
//       resource_type: "auto",

//       // ✅ IMPORTANT: control public_id
//       public_id: `${Date.now()}-${file.originalname.split(".")[0]}`,
//     };
//   },
// });

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const folder = req.body.folder || "products";

    const cleanName = file.originalname
      .split(".")[0]
      .replace(/\s+/g, "-")
      .toLowerCase();

    return {
      folder, // ✅ folder handled here
      resource_type: "auto",
      public_id: `${Date.now()}-${cleanName}`, // ✅ NO folder here
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

// ==============================
// ❌ OLD WAY (URL parsing) — BAD
// ==============================
// will break with versions like /v12345/

// ==============================
// ✅ NEW WAY (USE public_id)
// ==============================
// const deleteFile = async (publicId) => {
//   try {
//     if (!publicId) return;

//     await cloudinary.uploader.destroy(publicId);
//   } catch (error) {
//     console.error("Cloudinary delete error:", error.message);
//   }
// };


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