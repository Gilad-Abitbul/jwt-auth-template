module.exports = {
  passwordResetOtpVerify: [
    { keyPrefix: 'VerifyOtpPer5minEmail', points: 5, duration: 300, keyBy: 'email' },
    { keyPrefix: 'VerifyOtpPer10minIP', points: 10, duration: 600, keyBy: 'ip' },
  ],
  passwordResetExecution: [
    { keyPrefix: 'ResetPerIP', points: 1, duration: 600, keyBy: 'ip' },
  ],
}; 