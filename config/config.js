// App configuration variables
module.exports = {
    // JWT settings
    jwt: {
      secret: process.env.JWT_SECRET,
      expiresIn: process.env.JWT_EXPIRE || '7d',
    },
    
    // Email settings
    email: {
      service: process.env.EMAIL_SERVICE,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
      from: process.env.EMAIL_FROM,
    },
    
    // SMS settings
    sms: {
      accountSid: process.env.TWILIO_ACCOUNT_SID,
      authToken: process.env.TWILIO_AUTH_TOKEN,
      phoneNumber: process.env.TWILIO_PHONE_NUMBER,
    },
    
    // File upload settings
    fileUpload: {
      path: process.env.FILE_UPLOAD_PATH || './public/uploads',
      maxSize: process.env.MAX_FILE_SIZE || 5000000, // 5MB in bytes
    },
    
    // OTP settings
    otp: {
      expiresIn: 10 * 60 * 1000, // 10 minutes in milliseconds
      length: 6,
    }
  };