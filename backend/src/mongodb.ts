import mongoose from 'mongoose';
import { env } from './env';


const MONGODB_URI: string = env.mongodbUri;

/**
 * Establishes a connection to the MongoDB database using Mongoose.
 * 
 * This function asynchronously attempts to connect to the MongoDB database using
 * the connection URI specified in the `MONGODB_URI` environment variable.
 * If the connection is successful, it logs "Connected to MongoDB" to the console.
 * If there is an error during the connection process, the error is logged and
 * the process exits with an exit code of 1.
 * 
 * @async
 * @function connectDB
 * @throws {Error} If the connection to MongoDB fails, an error is logged and the process exits.
 */
export const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");
  } catch (err) {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  }
};