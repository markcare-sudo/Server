const ApiError = require("../core/errors/ApiError");
const { decryptPayload } = require("../utils/bodyCrypto");

module.exports = function decryptBodyMiddleware(req, res, next) {
  try {
    if (process.env.ENABLE_BODY_ENCRYPTION !== "true") return next();

    // Decrypt only if request looks encrypted OR header says so
    const headerFlag = String(req.headers["x-payload-encrypted"] || "").toLowerCase();
    const looksEncrypted = req.body?.data && req.body?.iv && req.body?.tag;

    if (headerFlag === "true" || looksEncrypted) {
      const { data, iv, tag } = req.body || {};
      if (!data || !iv || !tag) throw new ApiError(400, "Encrypted body requires data, iv, tag");

      req.body = decryptPayload({ data, iv, tag }); // ✅ overwrite with decrypted JSON
    }

    return next();
  } catch (err) {
    return next(err instanceof ApiError ? err : new ApiError(400, "Invalid encrypted payload"));
  }
};
