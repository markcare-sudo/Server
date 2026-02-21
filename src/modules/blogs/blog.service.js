
/* modules/blogs/blog.service.js */

const { Blog } = require("./blog.model");
const { Tag } = require("../tags/tag.model");
const { Keyword } = require("../keywords/keyword.model");
const { Op } = require("sequelize");
const slugify = require("slugify");
const { cloudinary_js_config } = require("../../config/cloudinary");


// ==========================
// SLUG GENERATOR
// ==========================
const generateSlug = async (title) => {
  const baseSlug = slugify(title, { lower: true, strict: true });
  let slug = baseSlug;
  let count = 1;

  while (await Blog.findOne({ where: { slug } })) {
    slug = `${baseSlug}-${count++}`;
  }

  return slug;
};


// ==========================
// CREATE BLOG
// ==========================
const createBlog = async (data) => {
  let { tags = [], keywords = [], ...blogData } = data;

  // Fix array parsing
  if (typeof tags === "string") {
    try {
      tags = JSON.parse(tags);
    } catch {
      tags = tags.split(",").map(t => t.trim());
    }
  }

  if (typeof keywords === "string") {
    try {
      keywords = JSON.parse(keywords);
    } catch {
      keywords = keywords.split(",").map(k => k.trim());
    }
  }

  tags = Array.isArray(tags) ? tags.filter(Boolean) : [];
  keywords = Array.isArray(keywords) ? keywords.filter(Boolean) : [];

  const slug = await generateSlug(blogData.title);

  const wordCount = blogData.content?.split(/\s+/).length || 0;
  blogData.reading_time = Math.ceil(wordCount / 200);

  const blog = await Blog.create({
    ...blogData,
    slug,
    author_id: 1,
    published_at: blogData.status === "published" ? new Date() : null,
  });

  // 🔥 TAGS
  if (tags.length) {
    const tagInstances = await Promise.all(
      tags.map(async (name) => {
        const tagSlug = slugify(name, { lower: true, strict: true });

        const [tag] = await Tag.findOrCreate({
          where: { slug: tagSlug },
          defaults: { name, slug: tagSlug },
        });

        return tag;
      })
    );

    await blog.setTags(tagInstances);
  }

  // 🔥 KEYWORDS
  if (keywords.length) {
    const keywordInstances = await Promise.all(
      keywords.map(async (key) => {
        const [keyword] = await Keyword.findOrCreate({
          where: { keyword: key },
          defaults: { keyword: key },
        });

        return keyword;
      })
    );

    await blog.setKeywords(keywordInstances);
  }

  return getBlogById(blog.id);
};

// ==========================
// UPDATE BLOG
// ==========================
const updateBlog = async (id, data) => {
  const blog = await Blog.findByPk(id);
  if (!blog) throw new Error("Blog not found");

  let { tags = [], keywords = [], ...updateData } = data;

  // -------------------------
  // Fix array parsing (same as create)
  // -------------------------
  if (typeof tags === "string") {
    try {
      tags = JSON.parse(tags);
    } catch {
      tags = tags.split(",").map(t => t.trim());
    }
  }

  if (typeof keywords === "string") {
    try {
      keywords = JSON.parse(keywords);
    } catch {
      keywords = keywords.split(",").map(k => k.trim());
    }
  }

  tags = Array.isArray(tags) ? tags.filter(Boolean) : [];
  keywords = Array.isArray(keywords) ? keywords.filter(Boolean) : [];

  // -------------------------
  // Regenerate slug if title changed
  // -------------------------
  if (updateData.title && updateData.title !== blog.title) {
    updateData.slug = await generateSlug(updateData.title);
  }

  // -------------------------
  // Recalculate reading time
  // -------------------------
  if (updateData.content) {
    const wordCount = updateData.content.split(/\s+/).length;
    updateData.reading_time = Math.ceil(wordCount / 200);
  }

  // -------------------------
  // Handle publish date
  // -------------------------
  if (
    updateData.status === "published" &&
    blog.status !== "published"
  ) {
    updateData.published_at = new Date();
  }

  // -------------------------
  // Update Blog
  // -------------------------
  await blog.update(updateData);

  // -------------------------
  // Sync TAGS
  // -------------------------
  if (tags.length) {
    const tagInstances = await Promise.all(
      tags.map(async (name) => {
        const tagSlug = slugify(name, { lower: true, strict: true });

        const [tag] = await Tag.findOrCreate({
          where: { slug: tagSlug },
          defaults: { name, slug: tagSlug },
        });

        return tag;
      })
    );

    await blog.setTags(tagInstances); // replaces old tags
  } else {
    await blog.setTags([]); // remove all if empty
  }

  // -------------------------
  // Sync KEYWORDS
  // -------------------------
  if (keywords.length) {
    const keywordInstances = await Promise.all(
      keywords.map(async (key) => {
        const [keyword] = await Keyword.findOrCreate({
          where: { keyword: key },
          defaults: { keyword: key },
        });

        return keyword;
      })
    );

    await blog.setKeywords(keywordInstances); // replaces old
  } else {
    await blog.setKeywords([]);
  }

  return getBlogById(id);
};

// ==========================
// GET SINGLE BLOG
// ==========================
const getBlogById = async (id) => {
  return Blog.findByPk(id, {
    include: [
      { model: Tag, through: { attributes: [] } },
      { model: Keyword, through: { attributes: [] } },
    ],
  });
};


// ==========================
// GET ALL BLOGS (Filter by tag/keyword)
// ==========================
const getAllBlogs = async (query) => {
  const {
    page = 1,
    limit = 10,
    search,
    status,
    category,
    tag,
    keyword,
  } = query;

  const where = {};

  if (search) {
    where.title = { [Op.iLike]: `%${search}%` };
  }

  if (status) where.status = status;
  if (category) where.category = category;

  const offset = (page - 1) * limit;

  const include = [
    {
      model: Tag,
      through: { attributes: [] },
      required: false,
      ...(tag && { where: { slug: tag } }),
    },
    {
      model: Keyword,
      through: { attributes: [] },
      required: false,
      ...(keyword && {
        where: { keyword: { [Op.iLike]: `%${keyword}%` } },
      }),
    },
  ];

  const { rows, count } = await Blog.findAndCountAll({
    where,
    include,
    distinct: true,
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

const getSingleBlog = async (identifier, query = {}) => {
  const { status } = query;

  const where = {};

  // Check if identifier is numeric (ID) or string (slug)
  if (!isNaN(identifier)) {
    where.id = identifier;
  } else {
    where.slug = identifier;
  }

  if (status) {
    where.status = status;
  }

  const blog = await Blog.findOne({
    where,
    include: [
      {
        model: Tag,
        through: { attributes: [] },
      },
      {
        model: Keyword,
        through: { attributes: [] },
      },
    ],
  });

  if (!blog) {
    throw new Error("Blog not found");
  }

  // 🔥 Optional: increment views
  await blog.increment("view_count");

  return blog;
};


// ==========================
// DELETE BLOG
// ==========================
const deleteBlog = async (id) => {
  const blog = await Blog.findByPk(id);
  if (!blog) throw new Error("Blog not found");

  if (blog.featured_media) {
    try {
      await cloudinary_js_config.uploader.destroy(blog.featured_media, {
        resource_type: blog.media_type === "video" ? "video" : "image",
      });
    } catch (error) {
      console.error("Cloudinary delete failed:", error.message);
    }
  }

  await blog.destroy();
  return true;
};

const getRelatedBlogs = async (blogId, limit = 4) => {
  const blog = await Blog.findByPk(blogId, {
    include: [{ model: Tag }],
  });

  if (!blog) throw new Error("Blog not found");

  const tagIds = blog.Tags.map((t) => t.id);

  return Blog.findAll({
    include: [
      {
        model: Tag,
        where: { id: tagIds },
      },
    ],
    where: {
      id: { [Op.ne]: blogId },
      status: "published",
    },
    limit,
    distinct: true,
  });
};

const getTrendingKeywords = async (limit = 10) => {
  return Keyword.findAll({
    attributes: [
      "id",
      "keyword",
      [
        sequelize.literal(`(
          SELECT COUNT(*) 
          FROM blog_keywords 
          WHERE blog_keywords.keyword_id = Keyword.id
        )`),
        "usage_count",
      ],
    ],
    order: [[sequelize.literal("usage_count"), "DESC"]],
    limit,
  });
};

module.exports = {
  createBlog,
  updateBlog,
  getBlogById,
  getAllBlogs,
  deleteBlog,
  getRelatedBlogs,
  getTrendingKeywords,
  getSingleBlog,
};