import { IUser } from '../../models/user';

export type EmailType = 'OTP' | 'VERIFY' | 'RESET_SUCCESS';

export interface OtpEmailData {
  user: IUser;
  otp: string;
}

export interface VerifyEmailData {
  user: IUser;
  verificationLink: string;
}

export interface ResetSuccessEmailData {
  user: IUser;
}

export type EmailPayloadMap = {
  OTP: OtpEmailData;
  VERIFY: VerifyEmailData;
  RESET_SUCCESS: ResetSuccessEmailData;
};