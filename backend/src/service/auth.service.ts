import bcrypt from "bcryptjs";
import { EmailService } from "../utils/email/emailService";
import { UserService } from "./user.service";
import { UserDocument } from "../models/user";
import HttpError from "../utils/HttpError";
import { CreateUserRequestBody } from "../schemas/auth.schema";
import { TokenService, TokenPayloadData } from "./token.service";
import { config } from "../config";

export class AuthService {
  static async registerUser(data: CreateUserRequestBody): Promise<string> {
    const { password } = data;

    const hashedPassword = await bcrypt.hash(password, config.bcryptSaltRounds);

    const user: UserDocument = await UserService.createUser({ ...data, password: hashedPassword });
    const userId = user._id.toString();

    const payload: TokenPayloadData = { userId };

    const token: string = TokenService.generateToken(payload);
    const verificationLink: string = `${config.backendDomain}/api/v1/verify-email?token=${token}`;

    await EmailService.sendEmail('VERIFY', {
      user,
      verificationLink,
    });

    return user._id.toString();
  }

  static async loginUser(email: string, password: string): Promise<{ token: string }> {

    const user: UserDocument | null = await UserService.getUserByEmail(email);

    if (!user) throw new HttpError('Email and password do not match', 401);

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) throw new HttpError('Email and password do not match', 401);
    if (!user.verified) throw new HttpError('Email not verified', 403);

    const payload: TokenPayloadData = { userId: user._id.toString() };
    const token = TokenService.generateToken(payload);

    return { token };
  }
}