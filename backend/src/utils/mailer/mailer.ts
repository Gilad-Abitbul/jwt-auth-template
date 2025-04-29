/**
 * @module emailService
 * 
 * This module provides functionality to send different types of emails, such as
 * password reset emails, email confirmation emails, and notifications about password changes.
 * It uses `nodemailer` for email sending and defines an abstract class for email templates.
 * The module includes:
 * - A factory to create the appropriate email template based on the type of email.
 * - A builder to compose and send emails.
 * 
 * It is structured to support future email types and templates by extending the `EmailTemplate` class.
 * 
 * ### Usage:
 * 1. Create an instance of the appropriate `EmailTemplate` using the `EmailFactory`.
 * 2. Use the `EmailBuilder` to set the recipient's email and send the email.
 * 
 * Example:
 * ```typescript
 * const resetEmail = EmailFactory.create("reset-password", { username: "user123", otp: "123456" });
 * const emailBuilder = new EmailBuilder(resetEmail);
 * emailBuilder.setTo("user123@example.com").send();
 * ```
 */
import nodemailer, { Transporter } from 'nodemailer';
import generateHtmlForConfirmEmail from './templates/confirmEmailTemplate';
import generateHtmlForResetPassword from './templates/resetPasswordTemplate';
import generateHtmlForPasswordResetNotification from './templates/passwordChangeNotificationTemplate';

/**
 * Transporter instance from `nodemailer` to send emails.
 * This is configured using the service and authentication details from environment variables.
 * 
 * @type {Transporter}
 */
const transporter: Transporter = nodemailer.createTransport({
  service: process.env.NODEMAILER_SERVICE,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
});

/**
 * Abstract class representing a generic email template.
 * All email templates must inherit from this class and implement the methods `getSubject` and `getHtml`.
 * 
 * @abstract
 */
abstract class EmailTemplate {
  /**
   * Ensures the abstract class `EmailTemplate` cannot be instantiated directly.
   */
  constructor() {
    if (new.target === EmailTemplate) {
      throw new Error("EmailTemplate is abstract");
    }
  }
  /**
   * Gets the subject of the email.
   * 
   * @returns {string} The subject of the email.
   */
  abstract getSubject(): string;
  /**
   * Gets the HTML content of the email.
   * 
   * @returns {string} The HTML content of the email.
   */
  abstract getHtml(): string;
}

/**
 * Class representing the "Reset Password" email template.
 * This class generates the subject and HTML content for a password reset email.
 */
class ResetPasswordEmailTemplate extends EmailTemplate {
  private username: string;
  private otp: string;

  /**
   * Constructs a ResetPasswordEmailTemplate instance.
   * 
   * @param {string} username - The username of the recipient.
   * @param {string} otp - The one-time password (OTP) for resetting the password.
   */
  constructor(username: string, otp: string) {
    super();
    this.username = username;
    this.otp = otp;
  }

  getSubject(): string {
    return "Reset Your Password";
  }

  getHtml(): string {
    return generateHtmlForResetPassword(this.username, this.otp);
  }
}

/**
 * Class representing the "Password Reset Notification" email template.
 * This class generates the subject and HTML content for notifying the user that their password has been reset.
 */
class ResetPasswordNotificationEmailTemplate extends EmailTemplate {
  private username: string;

  /**
   * Constructs a ResetPasswordNotificationEmailTemplate instance.
   * 
   * @param {string} username - The username of the recipient.
   */
  constructor(username: string) {
    super();
    this.username = username;
  }

  getSubject(): string {
    return "Your Password Has Been Reset";
  }

  getHtml(): string {
    return generateHtmlForPasswordResetNotification(this.username);
  }
}

/**
 * Class representing the "Confirm Email" email template.
 * This class generates the subject and HTML content for an email confirmation email.
 */
class ConfirmEmailTemplate extends EmailTemplate {
  private username: string;
  private verificationLink: string;

  /**
   * Constructs a ConfirmEmailTemplate instance.
   * 
   * @param {string} username - The username of the recipient.
   * @param {string} verificationLink - The URL link for the email verification.
   */
  constructor(username: string, verificationLink: string) {
    super();
    this.username = username;
    this.verificationLink = verificationLink;
  }

  getSubject(): string {
    return "Verify Your Email";
  }

  getHtml(): string {
    return generateHtmlForConfirmEmail(this.username, this.verificationLink);
  }
}


/**
 * Factory class to create different types of email templates based on the provided type.
 * This class ensures that the correct template is created and passed to the EmailBuilder.
 */
class EmailFactory {
  /**
   * Creates an email template based on the type.
   * 
   * @param {string} type - The type of email template to create. Valid types: "reset-password", "confirm-email", "reset-password-notification".
   * @param {object} data - The data required for creating the email. For "reset-password" it includes `username` and `otp`; for "confirm-email" it includes `username` and `verificationLink`; for "reset-password-notification" it includes `username`.
   * 
   * @returns {EmailTemplate} The appropriate email template.
   * @throws {Error} If the email type is unknown.
   */
  static create(type: string, data: { username: string; otp?: string; verificationLink?: string }): EmailTemplate {
    switch (type) {
      case "reset-password":
        return new ResetPasswordEmailTemplate(data.username, data.otp!);
      case "confirm-email":
        return new ConfirmEmailTemplate(data.username, data.verificationLink!);
      case "reset-password-notification":
        return new ResetPasswordNotificationEmailTemplate(data.username);
      default:
        throw new Error("Unknown email type");
    }
  }
}

/**
 * Builder class to compose and send an email using the specified template.
 * This class allows setting the recipient email and sending the email using `nodemailer`.
 */
class EmailBuilder {
  private template: EmailTemplate;
  private to: string | null = null;

  /**
   * Constructs an EmailBuilder instance with the provided email template.
   * 
   * @param {EmailTemplate} template - The email template to be used for composing the email.
   */
  constructor(template: EmailTemplate) {
    this.template = template;
  }

  /**
   * Sets the recipient email address.
   * 
   * @param {string} email - The email address of the recipient.
   * @returns {EmailBuilder} The current EmailBuilder instance.
   */
  setTo(email: string): EmailBuilder {
    this.to = email;
    return this;
  }

  /**
   * Sends the email using the specified template and recipient email address.
   * 
   * @throws {Error} If the recipient email address is not set.
   * @returns {Promise<void>} A promise that resolves when the email is sent.
   */
  async send(): Promise<void> {
    if (!this.to) throw new Error("Recipient email is missing");

    await transporter.sendMail({
      from: `My Node.js App <${process.env.MAIL_USER}>`,
      to: this.to,
      subject: this.template.getSubject(),
      html: this.template.getHtml(),
    });
  }
}

export { EmailBuilder, EmailFactory };