/**
 * User Model Schema
 * -----------------
 * This Mongoose schema defines the structure of the "User" document
 * in the MongoDB database. It represents a registered user of the system
 * and includes essential authentication and profile information.
 *
 * Fields:
 * - firstName (String, required): The user's first name.
 * - lastName (String, required): The user's last name.
 * - email (String, required, unique): The user's unique email address.
 * - password (String, required, not selected by default): Hashed password for authentication.
 * - status (String, optional): A user-defined status message. Defaults to "On the path to success."
 * - createdAt (Date, auto-generated): Timestamp of when the user was created. Defaults to current date/time.
 *
 * Notes:
 * - The schema is used to create the "User" model for interacting with the users collection.
 */

const mongoose = require('mongoose');
const { Schema } = mongoose;

const userSchema = new Schema({
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    default: 'On the path to success.'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
})

module.exports = mongoose.model('User', userSchema);