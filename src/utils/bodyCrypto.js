const crypto = require("crypto");

function getKey() {
  const b64 = process.env.BODY_ENC_KEY_B64;
  if (!b64) throw new Error("BODY_ENC_KEY_B64 missing");
  const key = Buffer.from(b64, "base64");
  if (key.length !== 32) throw new Error("BODY_ENC_KEY_B64 must be 32 bytes base64");
  return key;
}

function decryptPayload({ data, iv, tag }) {
  const key = getKey();
  const ivBuf = Buffer.from(iv, "base64");
  const tagBuf = Buffer.from(tag, "base64");
  const encBuf = Buffer.from(data, "base64");

  const decipher = crypto.createDecipheriv("aes-256-gcm", key, ivBuf);
  decipher.setAuthTag(tagBuf);

  const dec = Buffer.concat([decipher.update(encBuf), decipher.final()]);
  return JSON.parse(dec.toString("utf8"));
}

module.exports = { decryptPayload };
