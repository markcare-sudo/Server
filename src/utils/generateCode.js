const crypto = require("crypto");

function generateTenantCodeFromName(name) {
  const slug = name
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, "")   // remove symbols
    .replace(/\s+/g, "_")         // spaces → _
    .slice(0, 20);                // keep it short

  const suffix = crypto.randomBytes(2).toString("hex").toUpperCase();

  return `${slug}-${suffix}`;
}

module.exports = { generateTenantCodeFromName };
