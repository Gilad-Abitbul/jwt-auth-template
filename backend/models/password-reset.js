/**
 * PasswordReset Model Schema
 * --------------------------
 * This Mongoose schema defines the structure of the "PasswordReset" document
 * in the MongoDB database. It represents a temporary password reset request
 * initiated by a user and stores a hashed one-time password (OTP) used for authentication.
 *
 * Fields:
 * - user (ObjectId, required): Reference to the associated user (from the "User" collection).
 * - hashedOtp (String, required): A hashed version of the one-time password (OTP) sent to the user's email.
 * - expiresAt (Date, required): The expiration date/time after which the OTP becomes invalid.
 * - used (Boolean, optional): Indicates whether the OTP has already been used. Defaults to false.
 * - createdAt / updatedAt (Date, auto-generated): Timestamps of when the reset request was created or updated.
 *
 * Notes:
 * - This schema is used to create the "PasswordReset" model for interacting with password reset requests.
 * - Each request is time-limited and should be validated before allowing password changes.
 * - The `timestamps` option automatically adds and maintains `createdAt` and `updatedAt` fields.
 */

const mongoose = require('mongoose');
const { Schema } = mongoose;

const passwordResetSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  hashedOtp: {
    type: String,
    required: true
  },
  expiresAt: {
    type: Date,
    required: true
  },
  used: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
})

module.exports = mongoose.model('PasswordReset', passwordResetSchema);