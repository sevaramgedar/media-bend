const twilio = require('twilio');
const config = require('../config/config');

// Create Twilio client
const client = twilio(
  config.sms.accountSid,
  config.sms.authToken
);

// Send OTP via SMS
exports.sendOtpSMS = async (phoneNumber, otp) => {
  try {
    await client.messages.create({
      body: `Your verification code for Social Media App is: ${otp}. This code will expire in 10 minutes.`,
      from: config.sms.phoneNumber,
      to: `+91${phoneNumber}`
    });
    return true;
  } catch (error) {
    console.error('SMS send error:', error);
    return false;
  }
};

// Send welcome SMS after successful registration
exports.sendWelcomeSMS = async (phoneNumber, name) => {
  try {
    await client.messages.create({
      body: `Welcome ${name || 'to Social Media App'}! Your account has been successfully created. Start by completing your profile and connecting with friends.`,
      from: config.sms.phoneNumber,
      to: phoneNumber
    });
    return true;
  } catch (error) {
    console.error('SMS send error:', error);
    return false;
  }
};