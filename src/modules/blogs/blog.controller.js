const blogService = require("./blog.service");
const asyncHandler = require("../../utils/asyncHandler");
const { ok, created, badRequest, notFound, serverError } = require("../../utils/apiResponse");

// ==========================
// CREATE BLOG
// ==========================
const create = asyncHandler(async (req, res) => {
  const publicId = req.file?.filename || null;
  const mediaType = req.file?.resource_type || null;

  const blog = await blogService.createBlog({
    ...req.body,
    featured_media: publicId,
    media_type: mediaType,
  });

  return created(res, blog, "Blog Created Successfully");
});

// ==========================
// UPDATE BLOG
// ==========================
const update = asyncHandler(async (req, res) => {
  const blogId = req.params.id;
  const updateData = { ...req.body };

  // Only update media if new file uploaded
  if (req.file) {
    updateData.featured_media = req.file.filename;

    // Works for multer
    updateData.media_type = req.file.mimetype?.startsWith("video")
      ? "video"
      : "image";
  }
  
  const blog = await blogService.updateBlog(blogId, updateData);
  return ok(res, blog, "Blog Updated Successfully");
});

// ==========================
// GET SINGLE BLOG
// ==========================
const getOne = asyncHandler(async (req, res) => {
  const blog = await blogService.getBlogById(req.params.id);

  if (!blog) {
    return notFound(res, "Blog not found");
  }

  return ok(res, blog);
});

// ==========================
// GET ALL BLOGS
// ==========================
const getAll = asyncHandler(async (req, res) => {
  const blogs = await blogService.getAllBlogs(req.query);
  
  // Since blogs object already contains success structure, we can just send it, or assume it returns { data, pagination, ... }
  // We'll trust the original implementation returning res.json, but refactored to use ok.
  // Wait, if blogs has { data, pagination }, it's better to respond with res.json or ok().
  // Using original simple return for compatibility if we aren't 100% sure of object structure
  return res.json({
    success: true,
    ...blogs,
  });
});

// ==========================
// GET SINGLE BLOG (by ID or Slug)
// ==========================
const getSingle = asyncHandler(async (req, res) => {
  const { identifier } = req.params;
  const { status } = req.query; 

  const blog = await blogService.getSingleBlog(identifier, { status });
  // if not found, blogService likely throws an error based on previous behavior
  return ok(res, blog, "Blog fetched successfully");
});

// ==========================
// DELETE BLOG
// ==========================
const remove = asyncHandler(async (req, res) => {
  await blogService.deleteBlog(req.params.id);
  return ok(res, null, "Blog deleted successfully");
});

// ==========================
// GET RELATED BLOGS
// ==========================
const getRelated = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { limit } = req.query;

  const blogs = await blogService.getRelatedBlogs(
    id,
    Number(limit) || 4
  );

  return ok(res, blogs);
});

// ==========================
// GET TRENDING KEYWORDS
// ==========================
const getTrending = asyncHandler(async (req, res) => {
  const { limit } = req.query;

  const keywords = await blogService.getTrendingKeywords(
    Number(limit) || 10
  );

  return ok(res, keywords);
});

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