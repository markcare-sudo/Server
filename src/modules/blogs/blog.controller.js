/* modules/blogs/blog.controller.js */

const blogService = require("./blog.service");

const create = async (req, res) => {
  try {
    const blog = await blogService.createBlog(req.body);
    res.status(201).json({ success: true, message: "Blog Created Successfully", data: blog });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const update = async (req, res) => {
  try {
    const blog = await blogService.updateBlog(req.params.id, req.body);
    res.json({ success: true, message:"Blog Updated Successfully", data: blog });
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
};

const getOne = async (req, res) => {
  try {
    const blog = await blogService.getBlogById(req.params.id);
    if (!blog) return res.status(404).json({ message: "Blog not found" });

    res.json({ success: true, data: blog });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAll = async (req, res) => {
  try {
    const blogs = await blogService.getAllBlogs(req.query);
    res.json({ success: true, ...blogs });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const remove = async (req, res) => {
  try {
    await blogService.deleteBlog(req.params.id);
    res.json({ success: true, message: "Blog deleted successfully" });
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
};

module.exports = {
  create,
  update,
  getOne,
  getAll,
  remove,
};
