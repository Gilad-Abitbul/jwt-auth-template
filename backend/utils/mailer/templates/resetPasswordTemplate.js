/**
 * Generates HTML for the "Reset Password" email template
 * @param {string} username - The recipient's username
 * @param {string} otp - One-time password for password reset
 * @returns {string} HTML content
 */
const generateResetPasswordHtml = (username, otp) => {
  const formattedOtp = otp.toString().split('').join(' ');
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Password Reset</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          background-color: #f4f4f4;
          padding: 20px;
          color: #333;
        }
        .container {
          max-width: 600px;
          margin: auto;
          background-color: #fff;
          border-radius: 8px;
          padding: 30px;
          box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        h1 {
          color: #007acc;
          text-align: center;
        }
        .code-box {
          font-size: 24px;
          font-weight: bold;
          background-color: #f0f8ff;
          border: 1px dashed #007acc;
          padding: 15px;
          text-align: center;
          margin: 20px 0;
          border-radius: 6px;
        }
        .footer {
          margin-top: 30px;
          font-size: 14px;
          text-align: center;
          color: #666;
        }
        .footer a {
          color: #007acc;
          text-decoration: none;
        }
        .footer a:hover {
          text-decoration: underline;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>My Node.js Backend</h1>
        <p>Hello ${username},</p>
        <p>You have requested to reset your password from our app. Use the following code to complete the reset process:</p>
        <div class="code-box">${formattedOtp}</div>
        <p>This code will expire in 5 minutes. If you didn’t request this, you can safely ignore this email.</p>

        <div class="footer">
          <p>Developed by <strong>Gilad Abitbul</strong></p>
          <p>
            <a href="https://github.com/Gilad-Abitbul" target="_blank">GitHub</a> |
            <a href="https://linkedin.com/in/gilad-abitbul" target="_blank">LinkedIn</a> |
            <a href="mailto:abutbulgilad@gmail.com">abutbulgilad@gmail.com</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

module.exports = generateResetPasswordHtml;