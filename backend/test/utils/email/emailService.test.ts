import { EmailService } from '../../../src/utils/email/emailService';
import { transporter } from '../../../src/utils/email/transporter';
import { UserDocument } from '../../../src/models/user';

// Mock the transporter
jest.mock('../../../src/utils/email/transporter', () => ({
  transporter: { sendMail: jest.fn() },
}));

// Mock the templates
jest.mock('../../../src/utils/email/templates/otpEmail', () => ({
  generateOtpEmail: jest.fn(() => ({
    subject: 'OTP Subject',
    html: '<p>OTP Email</p>',
  })),
}));

jest.mock('../../../src/utils/email/templates/verifyEmail', () => ({
  generateVerifyEmail: jest.fn(() => ({
    subject: 'Verify Subject',
    html: '<p>Verify Email</p>',
  })),
}));

jest.mock('../../../src/utils/email/templates/passwordResetSuccess', () => ({
  generateResetSuccessEmail: jest.fn(() => ({
    subject: 'Reset Subject',
    html: '<p>Reset Success Email</p>',
  })),
}));

// Import mocks
import { generateOtpEmail } from '../../../src/utils/email/templates/otpEmail';
import { generateVerifyEmail } from '../../../src/utils/email/templates/verifyEmail';
import { generateResetSuccessEmail } from '../../../src/utils/email/templates/passwordResetSuccess';

describe('EmailService', () => {
  const mockUser = {
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
  } as UserDocument;

  afterEach(() => {
    jest.clearAllMocks();
  });

  const cases = [
    {
      type: 'OTP' as const,
      payload: { user: mockUser, otp: '123456' },
      templateFn: generateOtpEmail,
      expected: { subject: 'OTP Subject', html: '<p>OTP Email</p>' },
    },
    {
      type: 'VERIFY' as const,
      payload: { user: mockUser, verificationLink: 'http://example.com/verify' },
      templateFn: generateVerifyEmail,
      expected: { subject: 'Verify Subject', html: '<p>Verify Email</p>' },
    },
    {
      type: 'RESET_SUCCESS' as const,
      payload: { user: mockUser },
      templateFn: generateResetSuccessEmail,
      expected: { subject: 'Reset Subject', html: '<p>Reset Success Email</p>' },
    },
  ];

  test.each(cases)(
    'should send $type email with correct content',
    async ({ type, payload, templateFn, expected }) => {
      await EmailService.sendEmail(type, payload as any);

      expect(templateFn).toHaveBeenCalledWith(payload);
      expect(transporter.sendMail).toHaveBeenCalledWith({
        from: expect.stringContaining('no-reply'),
        to: mockUser.email,
        subject: expected.subject,
        html: expected.html,
      });
    }
  );
});