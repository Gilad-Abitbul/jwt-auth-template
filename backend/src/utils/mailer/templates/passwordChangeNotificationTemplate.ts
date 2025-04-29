/**
 * Generates HTML for the "Password Changed" email template
 * @param {string} username - The recipient's username
 * @returns {string} HTML content
 */
const generatePasswordChangedHtml = (username: string): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Password Changed</title>
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
        <p>Your password has been successfully changed.</p>
        <p>If you made this change, you can safely ignore this email.</p>
        <p>However, if you did <strong>not</strong> make this change, we recommend resetting your password immediately from the app or website to secure your account.</p>

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

export default generatePasswordChangedHtml;