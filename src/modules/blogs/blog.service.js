/* modules/blogs/blog.service.js */

const { Blog } = require("./blog.model");
const { Op } = require("sequelize");
const slugify = require("slugify");

const generateSlug = async (title) => {
    const baseSlug = slugify(title, { lower: true, strict: true });
    let slug = baseSlug;
    let count = 1;

    while (await Blog.findOne({ where: { slug } })) {
        slug = `${baseSlug}-${count++}`;
    }

    return slug;
};

const createBlog = async (data) => {
    const slug = await generateSlug(data.title);

    return Blog.create({
        ...data,
        slug,
        author_id: 1,
        published_at: data.status === "published" ? new Date() : null,
    });
};

const updateBlog = async (id, data) => {
    const blog = await Blog.findByPk(id);
    if (!blog) throw new Error("Blog not found");

    if (data.title && data.title !== blog.title) {
        data.slug = await generateSlug(data.title);
    }

    if (data.status === "published" && !blog.published_at) {
        data.published_at = new Date();
    }

    await blog.update(data);
    return blog;
};

const getBlogById = async (id) => {
    return Blog.findByPk(id);
};

const getAllBlogs = async (query) => {
    const { page = 1, limit = 10, search, status, category } = query;

    const where = {};

    if (search) {
        where.title = { [Op.like]: `%${search}%` };
    }

    if (status) where.status = status;
    if (category) where.category = category;

    const offset = (page - 1) * limit;

    const { rows, count } = await Blog.findAndCountAll({
        where,
        offset: Number(offset),
        limit: Number(limit),
        order: [["created_at", "DESC"]],
    });

    return {
        total: count,
        page: Number(page),
        pages: Math.ceil(count / limit),
        data: rows,
    };
};


const deleteBlog = async (id) => {
    const blog = await Blog.findByPk(id);
    if (!blog) throw new Error("Blog not found");

    await blog.destroy();
    return true;
};

module.exports = {
    createBlog,
    updateBlog,
    getBlogById,
    getAllBlogs,
    deleteBlog,
};
