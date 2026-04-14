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

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const folder = req.body.folder || "services"; // ✅ dynamic

    return {
      folder,
      resource_type: "auto",
    };
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 20 * 1024 * 1024,
  },
});

module.exports = upload;