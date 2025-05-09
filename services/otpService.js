const crypto = require('crypto');
const config = require('../config/config');
const User = require('../models/User');
const emailService = require('./emailService');
const smsService = require('./smsService');

class OTPService {
  // Generate a 6-digit OTP
  static generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Store OTP in user document
  static async storeOTP(userId, otp, type) {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    const hashedOTP = await this.hashOTP(otp);
    const expiry = Date.now() + config.otp.expiresIn;

    if (type === 'email') {
      user.emailVerificationToken = hashedOTP;
      user.emailVerificationExpire = expiry;
    } else if (type === 'mobile') {
      user.mobileVerificationOTP = hashedOTP;
      user.mobileVerificationExpire = expiry;
    }

    await user.save();
    return otp;
  }

  // Hash OTP for secure storage
  static async hashOTP(otp) {
    return crypto
      .createHash('sha256')
      .update(otp)
      .digest('hex');
  }

  // Send OTP via email
  static async sendEmailOTP(userId, email) {
    const otp = this.generateOTP();
    await this.storeOTP(userId, otp, 'email');

    await emailService.sendVerificationEmail(email, otp);
    return true;
  }

  // Send OTP via SMS
  static async sendMobileOTP(userId, mobile) {
    const otp = this.generateOTP();
    await this.storeOTP(userId, otp, 'mobile');

    await smsService.sendVerificationSMS(mobile, otp);
    return true;
  }

  // Verify OTP
  static async verifyOTP(userId, otp, type) {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    const hashedOTP = await this.hashOTP(otp);
    let storedOTP, expiry;

    if (type === 'email') {
      storedOTP = user.emailVerificationToken;
      expiry = user.emailVerificationExpire;
    } else if (type === 'mobile') {
      storedOTP = user.mobileVerificationOTP;
      expiry = user.mobileVerificationExpire;
    }

    if (!storedOTP || !expiry) {
      throw new Error('No OTP found');
    }

    if (Date.now() > expiry) {
      throw new Error('OTP expired');
    }

    if (storedOTP !== hashedOTP) {
      throw new Error('Invalid OTP');
    }

    // Clear OTP after successful verification
    if (type === 'email') {
      user.emailVerificationToken = undefined;
      user.emailVerificationExpire = undefined;
      user.isEmailVerified = true;
    } else if (type === 'mobile') {
      user.mobileVerificationOTP = undefined;
      user.mobileVerificationExpire = undefined;
      user.isMobileVerified = true;
    }

    await user.save();
    return true;
  }
}

module.exports = OTPService;
