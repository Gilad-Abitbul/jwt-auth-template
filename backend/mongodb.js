// Loads environment variables from the .env file (***only in development environment***)
require('dotenv').config()

const mongoose = require('mongoose');
const MONGODB_URI = process.env.MONGODB_URI;


exports.connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");
  } catch (err) {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  }
};