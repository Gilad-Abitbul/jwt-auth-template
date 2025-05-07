import User, { UserDocument } from "../models/user";
import { CreateUserRequestBody } from "../schemas/auth.schema";

export class UserService {
  static async createUser(data: CreateUserRequestBody): Promise<UserDocument> {
    const user = new User(data)
    return user.save();
  }

  static async getUserByEmail(email: string): Promise<UserDocument | null> {
    return await User.findOne({ email });
  }

  static async getUserById(userId: string): Promise<UserDocument | null> {
    return await User.findById(userId);
  }

  static async changePassword(user: UserDocument, hashedPassword: string): Promise<UserDocument> {
    user.password = hashedPassword;
    return await user.save();
  }

  static async setEmailVerified(user: UserDocument, isVerified: boolean): Promise<UserDocument> {
    user.verified = isVerified;
    return await user.save();
  }
}