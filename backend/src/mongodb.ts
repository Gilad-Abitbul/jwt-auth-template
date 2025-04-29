/**
 * @file This file contains the MongoDB connection logic for the application.
 * It uses the Mongoose library to connect to a MongoDB database and handles 
 * the connection process with error handling.
 * 
 * The `connectDB` function establishes a connection to the MongoDB database 
 * using the connection URI stored in the environment variables. If the connection
 * is successful, it logs a success message to the console. In case of an error,
 * the error is logged and the process exits with a failure code.
 * 
 * The connection URI is retrieved from the `MONGODB_URI` environment variable,
 * which should be set in a `.env` file.
 * 
 * @module Database
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables from the .env file
dotenv.config();

// MongoDB URI retrieved from the environment variable
const MONGODB_URI: string = process.env.MONGODB_URI as string;

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