import nodemailer from "nodemailer";

// Configure email transporter (example using Gmail)
// In production, consider using SendGrid, Mailgun, or other email services
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USERNAME || "mayankpatel6877@gmail.com",
    pass: process.env.EMAIL_PASSWORD || "tphrirwtwgplbjeu",
  },
});

/**
 * Send email
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML email content
 * @param {string} [options.text] - Plain text email content (optional)
 */
export const sendEmail = async (options) => {
  try {
    const mailOptions = {
      from:
        process.env.EMAIL_FROM || '"Smart School" <noreply@smartschool.com>',
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ""),
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error("Email sending failed:", error);
    throw error;
  }
};
