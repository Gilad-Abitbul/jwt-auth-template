import User, { UserDocument } from "../models/user";
import { CreateUserRequestBody } from "../schemas/auth.schema";

export class UserService {
  static async createUser(data: CreateUserRequestBody): Promise<UserDocument> {
    const user = new User(data)
    return user.save();
  }

  static async getUserByEmail(email: string): Promise<UserDocument | null> {
    return User.findOne({ email });
  }
}