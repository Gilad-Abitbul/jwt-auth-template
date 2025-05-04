import User, { UserDocument } from "../models/user";

interface CreateUserData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export class UserService {
  static async createUser(data: CreateUserData): Promise<UserDocument> {
    const user = new User(data)
    return user.save();
  }
}