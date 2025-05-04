import { Schema, model, Types, HydratedDocument } from 'mongoose';

const userSchema = new Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    status: { type: String, default: 'On the path to success.' },
    verified: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

export type IUser = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  status?: string;
  verified?: boolean;
};

export type UserDocument = HydratedDocument<IUser>;

const User = model<UserDocument>('User', userSchema);

export default User;