const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  }
});

async function sendMail({ to, subject, html, text }) {
  try {
    return await transporter.sendMail({
      from: `"${process.env.APP_NAME || "Mark Care"}" <${process.env.SMTP_USER}>`,
      to,
      subject,
      text: text || "Please view this email in HTML format.",
      html,
    });
  } catch (error) {
    console.error("Mail Error:", error.message);
    throw error;
  }
}

async function sendEmailVerificationLink({ to, name, labName, verifyUrl }) {
  const subject = `Verify your email for ${labName}`;

  const html = `
    <div style="font-family: Arial, sans-serif;">
      <h2>Hello ${name},</h2>
      <p>Your lab <b>${labName}</b> has been created successfully.</p>
      <p>Please verify your email by clicking the button below:</p>

      <p>
        <a href="${verifyUrl}" 
           style="
             display:inline-block;
             padding:10px 18px;
             background:#2563eb;
             color:#fff;
             text-decoration:none;
             border-radius:6px;
           ">
          Verify Email
        </a>
      </p>

      <p>If you did not request this, please ignore this email.</p>

      <br/>
      <small>This link will expire in 24 hours.</small>
    </div>
  `;

  await sendMail({ to, subject, html });
}

async function sendUserEmailVerificationLink({ to, name, verifyUrl }) {
  const subject = `Verify your account - ${process.env.APP_NAME}`;

  const html = `
    <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px;">
      <h2>Welcome, ${name}!</h2>
      <p>Thank you for joining <b>${process.env.APP_NAME}</b>.</p>
      <p>To complete your registration and secure your account, please verify your email address by clicking the button below:</p>

      <div style="margin: 30px 0;">
        <a href="${verifyUrl}" 
           style="
             display:inline-block;
             padding:12px 24px;
             background:#2563eb;
             color:#ffffff;
             text-decoration:none;
             border-radius:6px;
             font-weight: bold;
           ">
          Verify My Account
        </a>
      </div>

      <p>If you did not create an account, you can safely ignore this email.</p>
      <hr style="border:none; border-top:1px solid #eee; margin: 20px 0;" />
      <small style="color: #666;">This link will expire in 24 hours.</small>
    </div>
  `;

  await sendMail({ to, subject, html });
}

module.exports = { sendMail, sendEmailVerificationLink, sendUserEmailVerificationLink };
