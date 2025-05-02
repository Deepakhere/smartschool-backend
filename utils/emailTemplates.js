/**
 * Generates HTML for password reset email
 * @param {string} resetUrl - The password reset URL with token
 * @returns {string} - HTML email template
 */
export const getPasswordResetTemplate = (resetUrl) => {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your Smart School Password</title>
    <style>
      /* Base styles */
      body {
        font-family: 'Helvetica Neue', Arial, sans-serif;
        line-height: 1.6;
        color: #333;
        background-color: #f5f5f5;
        margin: 0;
        padding: 0;
      }
      
      .email-container {
        max-width: 600px;
        margin: 0 auto;
        background-color: #ffffff;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
      }
      
      /* Header styles */
      .email-header {
        background: linear-gradient(135deg, #2980b9 0%, #1a5276 100%);
        padding: 30px 20px;
        text-align: center;
      }
      
      .logo {
        width: 180px;
        margin-bottom: 15px;
      }
      
      .header-title {
        color: #ffffff;
        margin: 0;
        font-size: 24px;
        font-weight: 600;
      }
      
      /* Content styles */
      .email-content {
        padding: 30px 40px;
      }
      
      h2 {
        color: #2980b9;
        font-size: 22px;
        margin-top: 0;
        margin-bottom: 20px;
      }
      
      p {
        margin-bottom: 20px;
        color: #555;
        font-size: 16px;
      }
      
      .highlight {
        font-weight: 600;
        color: #333;
      }
      
      .reset-button {
        display: inline-block;
        background-color: #2980b9;
        color: #ffffff !important;
        text-decoration: none;
        padding: 14px 30px;
        border-radius: 6px;
        font-weight: 600;
        margin: 20px 0;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
        transition: background-color 0.3s ease;
      }
      
      .reset-button:hover {
        background-color: #1a5276;
      }
      
      .expiry-notice {
        font-size: 14px;
        background-color: #f8f8f8;
        padding: 12px 15px;
        border-radius: 6px;
        border-left: 3px solid #2980b9;
        margin: 25px 0;
      }
      
      .security-note {
        font-style: italic;
        font-size: 15px;
        color: #777;
      }
      
      /* Footer styles */
      .email-footer {
        background-color: #f2f2f2;
        padding: 20px;
        text-align: center;
        border-top: 1px solid #e5e5e5;
      }
      
      .footer-text {
        font-size: 14px;
        color: #777;
        margin: 0 0 10px 0;
      }
      
      .social-links {
        margin-top: 15px;
      }
      
      .social-icon {
        display: inline-block;
        width: 32px;
        height: 32px;
        background-color: #2980b9;
        border-radius: 50%;
        margin: 0 5px;
        text-align: center;
        line-height: 32px;
        color: white !important;
        text-decoration: none;
        font-size: 18px;
      }
    </style>
  </head>
  <body>
    <div class="email-container">
      <div class="email-header">
        <div class="header-title">Smart School</div>
      </div>
      
      <div class="email-content">
        <h2>Password Reset Request</h2>
        
        <p>Hello,</p>
        
        <p>We received a request to reset the password for your <span class="highlight">Smart School</span> account. Don't worry, we're here to help you regain access to your learning journey!</p>
        
        <p style="text-align: center;">
          <a href="${resetUrl}" class="reset-button" target="_blank">Reset Your Password</a>
        </p>
        
        <div class="expiry-notice">
          <strong>Note:</strong> This password reset link will expire in 1 hour for security reasons.
        </div>
        
        <p>If you did not request a password reset, please disregard this email. Your account security is important to us, and your password will remain unchanged.</p>
        
        <p class="security-note">For security purposes, this link can only be used once. If you need to reset your password again, please visit <a href="#">smartschool.com</a> and request a new link.</p>
        
        <p>Thank you for being part of our learning community!</p>
        
        <p>Best regards,<br>
        The Smart School Team</p>
      </div>
      
      <div class="email-footer">
        <p class="footer-text">© 2025 Smart School. All rights reserved.</p>
        <p class="footer-text">123 Education Avenue, Knowledge City, ST 54321</p>
        <div class="social-links">
          <a href="#" class="social-icon">f</a>
          <a href="#" class="social-icon">t</a>
          <a href="#" class="social-icon">in</a>
        </div>
      </div>
    </div>
  </body>
  </html>
    `;
};
