const blogService = require("./blog.service");


// ==========================
// CREATE BLOG
// ==========================
const create = async (req, res) => {
  try {
    const publicId = req.file?.filename || null;
    const mediaType = req.file?.resource_type || null;

    const blog = await blogService.createBlog({
      ...req.body,
      featured_media: publicId,
      media_type: mediaType,
    });

    return res.status(201).json({
      success: true,
      message: "Blog Created Successfully",
      data: blog,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};


// ==========================
// UPDATE BLOG
// ==========================
// const update = async (req, res) => {
//   try {
//     const blogId = req.params.id;
//     const publicId = req.file?.filename;
//     const mediaType = req.file?.resource_type;

//     const blog = await blogService.updateBlog(blogId, {
//       ...req.body,
//       ...(publicId && {
//         featured_media: publicId,
//         media_type: mediaType,
//       }),
//     });

//     return res.json({
//       success: true,
//       message: "Blog Updated Successfully",
//       data: blog,
//     });
//   } catch (error) {
//     return res.status(404).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };


const update = async (req, res) => {
  try {
    const blogId = req.params.id;

    const updateData = { ...req.body };

    // ✅ Only update media if new file uploaded
    if (req.file) {
      updateData.featured_media = req.file.filename;

      // 🔥 Works for multer
      updateData.media_type = req.file.mimetype?.startsWith("video")
        ? "video"
        : "image";
    }
    
    const blog = await blogService.updateBlog(blogId, updateData);

    return res.json({
      success: true,
      message: "Blog Updated Successfully",
      data: blog,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};


// ==========================
// GET SINGLE BLOG
// ==========================
const getOne = async (req, res) => {
  try {
    const blog = await blogService.getBlogById(req.params.id);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      });
    }

    return res.json({
      success: true,
      data: blog,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ==========================
// GET ALL BLOGS
// ==========================
const getAll = async (req, res) => {
  try {
    const blogs = await blogService.getAllBlogs(req.query);

    return res.json({
      success: true,
      ...blogs,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ==========================
// GET SINGLE BLOG (by ID or Slug)
// ==========================
const getSingle = async (req, res) => {
  try {
    const { identifier } = req.params;
    const { status } = req.query; 

    const blog = await blogService.getSingleBlog(identifier, { status });

    return res.status(200).json({
      success: true,
      message: "Blog fetched successfully",
      data: blog,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};



// ==========================
// DELETE BLOG
// ==========================
const remove = async (req, res) => {
  try {
    await blogService.deleteBlog(req.params.id);

    return res.json({
      success: true,
      message: "Blog deleted successfully",
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================
// GET RELATED BLOGS
// ==========================
const getRelated = async (req, res) => {
  try {
    const { id } = req.params;
    const { limit } = req.query;

    const blogs = await blogService.getRelatedBlogs(
      id,
      Number(limit) || 4
    );

    return res.status(200).json({
      success: true,
      data: blogs,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};


// ==========================
// GET TRENDING KEYWORDS
// ==========================
const getTrending = async (req, res) => {
  try {
    const { limit } = req.query;

    const keywords = await blogService.getTrendingKeywords(
      Number(limit) || 10
    );

    return res.status(200).json({
      success: true,
      data: keywords,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  create,
  update,
  getOne,
  getAll,
  remove,
  getSingle,
  getRelated,
  getTrending,
};