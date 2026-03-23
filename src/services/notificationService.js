/**
 * @fileoverview Robust asynchronous interceptors handling Twilio and Nodemailer fire-and-forget logic correctly isolating core loops.
 */

const { TEMPLATES } = require("../config/notificationTemplates");

// Safe optional mappings mitigating rigid errors cleanly structurally out of bounds natively
let twilioClient;
let emailTransporter;

try { 
  twilioClient = require("../config/twilio"); 
} catch(e) { /* Optionally omitted structurally */ }

try { 
  emailTransporter = require("../config/nodemailer"); 
} catch(e) { /* Optionally omitted structurally */ }

const sendSMS = async (to, templateKey, data) => {
  try {
    const template = TEMPLATES[templateKey];
    if (!template) throw new Error("Template exclusively fundamentally undefined");
    const body = template.smsBody(data);
    
    if (twilioClient) {
      await twilioClient.messages.create({
        body,
        from: process.env.TWILIO_PHONE_NUMBER || "MARKCARE",
        to
      });
    } else {
      console.log(`[SMS MOCK] => To: ${to} | Template: ${templateKey}`);
    }
    
    return { to, template: templateKey, status: 'sent' };
  } catch (error) {
    console.error(`[SMS NON-BLOCKING FAIL] => To: ${to} | Err: ${error.message}`);
    return { to, template: templateKey, status: 'failed', error: error.message };
  }
};

const sendEmail = async (to, templateKey, data) => {
  try {
    const template = TEMPLATES[templateKey];
    if (!template) throw new Error("Template intrinsically natively missing structurally");
    
    if (emailTransporter) {
      await emailTransporter.sendMail({
        from: process.env.EMAIL_FROM || "no-reply@markcare.com",
        to,
        subject: template.subject,
        html: template.emailBody(data)
      });
    } else {
      console.log(`[EMAIL MOCK] => To: ${to} | Subject: ${template.subject}`);
    }

    return { to, template: templateKey, status: 'sent' };
  } catch (error) {
    console.error(`[EMAIL NON-BLOCKING FAIL] => To: ${to} | Err: ${error.message}`);
    return { to, template: templateKey, status: 'failed', error: error.message };
  }
};

const notify = async (user, templateKey, data) => {
  // Asynchronously execute arrays gracefully avoiding sequential bottlenecks structurally utilizing Promise.allSettled natively exactly
  const promises = [];
  
  if (user && user.phone) promises.push(sendSMS(user.phone, templateKey, data));
  if (user && user.email) promises.push(sendEmail(user.email, templateKey, data));
  
  const results = await Promise.allSettled(promises);
  
  return {
    sms: user?.phone ? (results[0]?.value?.status || 'failed') : 'skipped',
    email: user?.email ? (results[1]?.value?.status || 'failed') : 'skipped'
  };
};

module.exports = { sendSMS, sendEmail, notify };
