/**
 * Generates HTML for the "Confirm Email" email template
 * @param {string} username - The recipient's username
 * @param {string} verificationLink - The link to verify the user's email
 * @returns {string} HTML content
 */
const generateConfirmEmailHtml = (username: string, verificationLink: string): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Email Verification</title>
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
        .verify-box {
          text-align: center;
          margin: 30px 0;
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
        <p>Welcome to our app! To start enjoying our services, please verify your email address by clicking the button below:</p>
        
        <div class="verify-box">
          <a href="${verificationLink}" 
            style="display:inline-block; background-color:#007acc; color:white; padding:12px 25px; text-decoration:none; font-size:16px; border-radius:6px;">
            Verify Email
          </a>
        </div>
        
        <p>If you didn't sign up for our app, feel free to ignore this email.</p>

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
};

export default generateConfirmEmailHtml;