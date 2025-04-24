module.exports = {
  passwordResetOtpRequest: [
    { keyPrefix: 'ResetOtp30s', points: 1, duration: 30, keyBy: 'email' },
    { keyPrefix: 'ResetOtpPerDayEmail', points: 3, duration: 86400, keyBy: 'email' },
    { keyPrefix: 'ResetOtpPerDayIP', points: 5, duration: 86400, keyBy: 'ip' },
  ],
  passwordResetOtpVerify: [
    { keyPrefix: 'VerifyOtpPer5minEmail', points: 5, duration: 300, keyBy: 'email' },
    { keyPrefix: 'VerifyOtpPer10minIP', points: 10, duration: 600, keyBy: 'ip' },
  ],
  passwordResetExecution: [
    { keyPrefix: 'ResetPerIP', points: 1, duration: 600, keyBy: 'ip' },
  ],
};