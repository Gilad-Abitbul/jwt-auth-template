// Loads environment variables from the .env file (***only in development environment***)
require('dotenv').config()

const nodemailer = require('nodemailer');

const generateHtmlForConfirmEmail = require('./templates/confirmEmailTemplate.js');
const generateHtmlForResetPassword = require('./templates/resetPasswordTemplate.js');

// Create and configure the nodemailer transporter using environment variables
const transporter = nodemailer.createTransport({
  service: process.env.NODEMAILER_SERVICE,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
});

/**
 * Abstract base class for email templates
 */
class EmailTemplate {
  constructor() {
    if (new.target === EmailTemplate) {
      throw new Error("EmailTemplate is abstract");
    }
  }

  /**
   * Returns the subject of the email
   * @returns {string}
   */
  getSubject() {
    throw new Error("Must implement getSubject()");
  }

  /**
   * Returns the HTML body of the email
   * @returns {string}
   */ 
  getHtml() {
    throw new Error("Must implement getHtml()");
  }
}

/**
 * Email template for password reset
 */
class ResetPasswordEmailTemplate extends EmailTemplate {
  constructor(username, otp) {
    super();
    this.username = username;
    this.otp = otp;
  }

  getSubject() {
    return "Reset Your Password";
  }

  getHtml() {
    return generateHtmlForResetPassword(this.username, this.otp);
  }
}

/**
 * Email template for email confirmation
 */
class ConfirmEmailTemplate extends EmailTemplate {
  constructor(username, verificationLink) {
    super();
    this.username = username;
    this.verificationLink = verificationLink;
  }

  getSubject() {
    return "Verify Your Email";
  }

  getHtml() {
    return generateHtmlForConfirmEmail(this.username, this.verificationLink);
  }
}

/**
 * Factory class for creating email templates
 */
class EmailFactory {
  /**
   * Creates a specific email template based on type
   * @param {string} type - Type of email (e.g., 'reset-password')
   * @param {object} data - Data needed for template
   * @returns {EmailTemplate}
   */
  static create(type, data) {
    switch (type) {
      case "reset-password":
        return new ResetPasswordEmailTemplate(data.username, data.otp);
      case "confirm-email":
        return new ConfirmEmailTemplate(data.username, data.verificationLink);
      default:
        throw new Error("Unknown email type");
    }
  }
}

/**
 * Builder class to configure and send emails
 */
class EmailBuilder {
  /**
   * @param {EmailTemplate} template - Email template instance
   */
  constructor(template) {
    this.template = template;
    this.to = null;
  }

  /**
   * Sets the recipient email address
   * @param {string} email - Recipient's email address
   * @returns {EmailBuilder}
   */
  setTo(email) {
    this.to = email;
    return this;
  }

  /**
   * Sends the email using nodemailer
   * @returns {Promise}
   */
  async send() {
    if (!this.to) throw new Error("Recipient email is missing");

    return transporter.sendMail({
      from: `My Node.js App <${process.env.MAIL_USER}>`,
      to: this.to,
      subject: this.template.getSubject(),
      html: this.template.getHtml(),
    });
  }
}

module.exports = {
  EmailBuilder,
  EmailFactory,
}