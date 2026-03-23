/**
 * @fileoverview Rigid fail-fast configurations preventing app crashes deep inside runtime unexpectedly gracefully explicitly natively.
 */

const validateEnv = () => {
  const isProd = process.env.NODE_ENV === "production";

  const REQUIRED_VARS = [
    "DB_NAME",
    "DB_USER",
    "DB_PASSWORD",
    "JWT_SECRET" // Auth is mandatory natively across environments
  ];

  if (isProd) {
    // Production inherently enforces explicit payment and strict routing security
    REQUIRED_VARS.push(
      "RAZORPAY_KEY_ID",
      "RAZORPAY_SECRET",
      "RAZORPAY_WEBHOOK_SECRET"
    );
  }

  const missing = [];
  
  for (const key of REQUIRED_VARS) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    throw new Error(`\n❌ CRITICAL: Missing native logical environment properties blocking safe execution: \n${missing.join("\n")}\n`);
  }
};

module.exports = { validateEnv };
