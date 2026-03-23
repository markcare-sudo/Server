/**
 * @fileoverview Reusable request body validation middleware using Joi schemas.
 */

const AppError = require("../utils/AppError");

/**
 * Validates request body asynchronously against a provided Joi schema.
 * @param {import("joi").ObjectSchema} schema 
 */
const validate = (schema) => {
  return async (req, res, next) => {
    try {
      req.body = await schema.validateAsync(req.body, { abortEarly: false, stripUnknown: true });
      next();
    } catch (err) {
      if (err.isJoi) {
        const errors = err.details.map(d => d.message).join(", ");
        return next(new AppError(`Validation Error: ${errors}`, 400));
      }
      next(err);
    }
  };
};

module.exports = validate;
