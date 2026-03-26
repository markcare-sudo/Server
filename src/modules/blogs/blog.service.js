const { Blog } = require("./blog.model");
const { Tag } = require("../tags/tag.model");
const { Keyword } = require("../keywords/keyword.model");
const { Op } = require("sequelize");
const slugify = require("slugify");
const { cloudinary_js_config } = require("../../config/cloudinary");
const sequelize = Blog.sequelize;

// ==========================
// HELPERS
// ==========================

/**
 * Generates a unique slug by checking the database.
 * Prevents "SequelizeUniqueConstraintError"
 */
const generateUniqueSlug = async (title, currentId = null) => {
  let baseSlug = slugify(title, { lower: true, strict: true });
  let uniqueSlug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await Blog.findOne({
      where: {
        slug: uniqueSlug,
        ...(currentId && { id: { [Op.ne]: currentId } }),
      },
    });
    if (!existing) break;
    uniqueSlug = `${baseSlug}-${counter}`;
    counter++;
  }
  return uniqueSlug;
};

/**
 * Safely handles array inputs from frontend (JSON strings or Arrays)
 */
const parseArrayInput = (input) => {
  if (!input) return [];
  if (Array.isArray(input)) return input;
  try {
    const parsed = JSON.parse(input);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return typeof input === "string" ? input.split(",").map((s) => s.trim()) : [];
  }
};

// ==========================
// CREATE BLOG
// ==========================
const createBlog = async (data) => {
  const t = await sequelize.transaction();
  try {
    let { tags = [], keywords = [], ...blogData } = data;

    tags = parseArrayInput(tags);
    keywords = parseArrayInput(keywords);

    const slug = await generateUniqueSlug(blogData.title);
    // Strip HTML tags before counting words for more accurate reading time
    const wordCount = blogData.content?.replace(/<[^>]*>/g, "").split(/\s+/).length || 0;

    const blog = await Blog.create(
      {
        ...blogData,
        slug,
        author_id: 1,
        reading_time: Math.ceil(wordCount / 200),
        published_at: blogData.status === "published" ? new Date() : null,
      },
      { transaction: t }
    );

    // Handle Tags
    if (tags.length) {
      const tagInstances = await Promise.all(
        tags.map(async (name) => {
          const [tag] = await Tag.findOrCreate({
            where: { slug: slugify(name, { lower: true, strict: true }) },
            defaults: { name, slug: slugify(name, { lower: true, strict: true }) },
            transaction: t,
          });
          return tag;
        })
      );
      await blog.setTags(tagInstances, { transaction: t });
    }

    // Handle Keywords
    if (keywords.length) {
      const keywordInstances = await Promise.all(
        keywords.map(async (key) => {
          const [keyword] = await Keyword.findOrCreate({
            where: { keyword: key },
            defaults: { keyword: key },
            transaction: t,
          });
          return keyword;
        })
      );
      await blog.setKeywords(keywordInstances, { transaction: t });
    }

    await t.commit();
    // Pass transaction to the getter so it can read the uncommitted/just-committed data
    return getBlogById(blog.id);
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

// ==========================
// UPDATE BLOG
// ==========================
const updateBlog = async (id, data) => {
  const t = await sequelize.transaction();
  try {
    const blog = await Blog.findByPk(id, { transaction: t });
    if (!blog) throw new Error("Blog not found");

    let { tags, keywords, ...updateData } = data;

    if (updateData.title && updateData.title !== blog.title) {
      updateData.slug = await generateUniqueSlug(updateData.title, id);
    }

    if (updateData.content) {
      const wordCount = updateData.content.replace(/<[^>]*>/g, "").split(/\s+/).length;
      updateData.reading_time = Math.ceil(wordCount / 200);
    }

    if (updateData.status === "published" && blog.status !== "published") {
      updateData.published_at = new Date();
    }

    await blog.update(updateData, { transaction: t });

    if (tags !== undefined) {
      const parsedTags = parseArrayInput(tags);
      const tagInstances = await Promise.all(
        parsedTags.map(async (name) => {
          const [tag] = await Tag.findOrCreate({
            where: { slug: slugify(name, { lower: true, strict: true }) },
            defaults: { name, slug: slugify(name, { lower: true, strict: true }) },
            transaction: t,
          });
          return tag;
        })
      );
      await blog.setTags(tagInstances, { transaction: t });
    }

    if (keywords !== undefined) {
      const parsedKeywords = parseArrayInput(keywords);
      const keywordInstances = await Promise.all(
        parsedKeywords.map(async (key) => {
          const [keyword] = await Keyword.findOrCreate({
            where: { keyword: key },
            defaults: { keyword: key },
            transaction: t,
          });
          return keyword;
        })
      );
      await blog.setKeywords(keywordInstances, { transaction: t });
    }

    await t.commit();
    return getBlogById(id);
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

// ==========================
// GET SINGLE BLOG
// ==========================
const getBlogById = async (id, options = {}) => {
  return Blog.findByPk(id, {
    include: [
      { model: Tag, as: "tags", through: { attributes: [] } },
      { model: Keyword, as: "keywords", through: { attributes: [] } },
    ],
    ...options
  });
};

const getSingleBlog = async (identifier, query = {}) => {
  const { status } = query;
  const isId = /^\d+$/.test(identifier);
  const where = isId ? { id: identifier } : { slug: identifier };

  if (status) where.status = status;

  const blog = await Blog.findOne({
    where,
    include: [
      { model: Tag, as: "tags", through: { attributes: [] } },
      { model: Keyword, as: "keywords", through: { attributes: [] } },
    ],
  });

  if (!blog) throw new Error("Blog not found");

  await Blog.increment('view_count', {
    by: 1,
    where: { id: blog.id },
    silent: true
  });

  return blog;
};

// ==========================
// LISTING & TRENDING
// ==========================
const getAllBlogs = async (query) => {
  const { page = 1, limit = 10, search, status, category, tag, keyword } = query;
  const where = {};

  if (search) where.title = { [Op.iLike]: `%${search}%` };
  if (status) where.status = status;
  if (category) where.category = category;

  const include = [
    {
      model: Tag,
      as: "tags",
      through: { attributes: [] },
      required: !!tag,
      ...(tag && { where: { slug: tag } }),
    },
    {
      model: Keyword,
      as: "keywords",
      through: { attributes: [] },
      required: !!keyword,
      ...(keyword && { where: { keyword: { [Op.iLike]: `%${keyword}%` } } }),
    },
  ];

  const { rows, count } = await Blog.findAndCountAll({
    where,
    include,
    distinct: true,
    offset: (Number(page) - 1) * Number(limit),
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

const getTrendingKeywords = async (limit = 10) => {
  return Keyword.findAll({
    attributes: [
      "id",
      "keyword",
      [
        sequelize.literal(`(
          SELECT COUNT(*) 
          FROM blog_keywords 
          WHERE blog_keywords.keyword_id = "Keyword".id
        )`),
        "usage_count",
      ],
    ],
    order: [[sequelize.literal("usage_count"), "DESC"]],
    limit,
  });
};

// ==========================
// DELETE
// ==========================
const deleteBlog = async (id) => {
  // 1. Fetch the blog including the media info
  const blog = await Blog.findByPk(id);
  if (!blog) throw new Error("Blog not found");

  // 2. Delete from Cloudinary first
  if (blog.featured_media) {
    try {
      /**
       * Cloudinary .destroy() requires the correct resource_type.
       * If media_type is null, default to "image".
       */
      const resourceType = blog.media_type === "video" ? "video" : "image";

      await cloudinary_js_config.uploader.destroy(blog.featured_media, {
        resource_type: resourceType
      });
    } catch (error) {
      // We log but don't stop, so the DB record can still be cleaned up
      console.error("Cloudinary delete failed:", error.message);
    }
  }

  /**
   * 3. Permanent Database Deletion
   * If your model has 'paranoid: true', .destroy() only sets deleted_at.
   * 'force: true' ensures the row is physically REMOVED from the table.
   */
  await blog.destroy({ force: true });

  return true;
};

module.exports = {
  createBlog,
  updateBlog,
  getBlogById,
  getAllBlogs,
  getSingleBlog,
  getTrendingKeywords,
  deleteBlog,
};