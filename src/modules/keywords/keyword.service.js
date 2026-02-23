const { Keyword } = require("./keyword.model");

/**
 * Create a new keyword
 * @param {Object} data 
 */
const createKeyword = async (data) => {
  return await Keyword.create(data);
};

/**
 * Get all keywords
 * @param {Object} filter 
 */
const getAllKeywords = async (filter = {}) => {
  return await Keyword.findAll({ where: filter });
};

/**
 * Get a single keyword by ID
 * @param {number} id 
 */
const getKeywordById = async (id) => {
  return await Keyword.findByPk(id);
};

/**
 * Update keyword by ID
 * @param {number} id 
 * @param {Object} data 
 */
const updateKeyword = async (id, data) => {
  const keyword = await Keyword.findByPk(id);
  if (!keyword) throw new Error("Keyword not found");
  return await keyword.update(data);
};

/**
 * Delete keyword by ID
 * @param {number} id 
 */
const deleteKeyword = async (id) => {
  const keyword = await Keyword.findByPk(id);
  if (!keyword) throw new Error("Keyword not found");
  await keyword.destroy();
  return true;
};

module.exports = {
  createKeyword,
  getAllKeywords,
  getKeywordById,
  updateKeyword,
  deleteKeyword,
};