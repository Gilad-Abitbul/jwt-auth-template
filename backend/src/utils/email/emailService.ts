import { transporter } from './transporter';
import {
  EmailPayloadMap,
  EmailType,
} from './emailTypes';

import { generateOtpEmail } from './templates/otpEmail';
import { generateVerifyEmail } from './templates/verifyEmail';
import { generateResetSuccessEmail } from './templates/passwordResetSuccess';

export class EmailService {
  static async sendEmail<T extends EmailType>(
    type: T,
    payload: EmailPayloadMap[T]
  ): Promise<void> {
    let subject = '';
    let html = '';
    const { user } = payload;

    switch (type) {
      case 'OTP': {
        const content = generateOtpEmail(payload as EmailPayloadMap['OTP']);
        subject = content.subject;
        html = content.html;
        break;
      }
      case 'VERIFY': {
        const content = generateVerifyEmail(payload as EmailPayloadMap['VERIFY']);
        subject = content.subject;
        html = content.html;
        break;
      }
      case 'RESET_SUCCESS': {
        const content = generateResetSuccessEmail(payload as EmailPayloadMap['RESET_SUCCESS']);
        subject = content.subject;
        html = content.html;
        break;
      }
    }

    await transporter.sendMail({
      from: `no-reply <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject,
      html,
    });
  }
}