import bcrypt from "bcryptjs";
import { EmailService } from "../utils/email/emailService";
import { UserService } from "./user.service";
import jwt from 'jsonwebtoken';
import { CreateUserRequestBody } from "../dtos/user.dto";

export class AuthService {
  static async registerUser(data: CreateUserRequestBody): Promise<string> {
    const { email, password, firstName, lastName } = data;

    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS as string, 10);
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const user = await UserService.createUser({
      email,
      password: hashedPassword,
      firstName,
      lastName,
    });

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET as string,
      { expiresIn: '1d' }
    );

    const verificationLink = `${process.env.BACKEND_DOMAIN}/api/v1/verify-email?token=${token}`;

    await EmailService.sendEmail('VERIFY', {
      user,
      verificationLink,
    });

    return user._id.toString();
  }
}