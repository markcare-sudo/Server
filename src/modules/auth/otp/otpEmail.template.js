function otpEmailTemplate({ otp, ttlMinutes }) {
  return {
    subject: "Your MarkCare Login OTP",
    text: `Your MarkCare OTP is ${otp}. Valid for ${ttlMinutes} minutes.`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:520px">
        <h2>MarkCare Login Verification</h2>
        <p>Your OTP is:</p>
        <div style="font-size:32px;letter-spacing:6px;font-weight:700">${otp}</div>
        <p>Valid for <b>${ttlMinutes} minutes</b>.</p>
        <p>If you did not request this, ignore this email.</p>
        <p>— MarkCare Security</p>
      </div>
    `,
  };
}

module.exports = { otpEmailTemplate };
