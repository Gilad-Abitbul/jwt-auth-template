import { UserDocument } from '../../models/user';

export type EmailType = 'OTP' | 'VERIFY' | 'RESET_SUCCESS';

export interface OtpEmailData {
  user: UserDocument;
  otp: string;
}

export interface VerifyEmailData {
  user: UserDocument;
  verificationLink: string;
}

export interface ResetSuccessEmailData {
  user: UserDocument;
}

export type EmailPayloadMap = {
  OTP: OtpEmailData;
  VERIFY: VerifyEmailData;
  RESET_SUCCESS: ResetSuccessEmailData;
};