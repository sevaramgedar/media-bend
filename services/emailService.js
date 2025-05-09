const nodemailer = require('nodemailer');
const config = require('../config/config');

// Create transporter
const transporter = nodemailer.createTransport({
  service: config.email.service,
  auth: {
    user: config.email.auth.user,
    pass: config.email.auth.pass
  }
});

// Send OTP email
exports.sendOtpEmail = async (email, otp) => {
  const mailOptions = {
    from: config.email.from,
    to: email,
    subject: 'Verification OTP for Your Account',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Account Verification</h2>
        <p>Thank you for registering! To complete your account setup, please use the verification code below:</p>
        <div style="background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px;">
          ${otp}
        </div>
        <p>This code will expire in 10 minutes.</p>
        <p>If you didn't request this code, please ignore this email.</p>
        <p>Best regards,<br>The Social Media App Team</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Email send error:', error);
    return false;
  }
};

// Send welcome email after successful registration
exports.sendWelcomeEmail = async (email, name) => {
  const mailOptions = {
    from: config.email.from,
    to: email,
    subject: 'Welcome to Social Media App!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome to Social Media App!</h2>
        <p>Hello ${name || 'there'},</p>
        <p>Thank you for joining our platform. We're excited to have you on board!</p>
        <p>Start exploring and connecting with others:</p>
        <ul>
          <li>Complete your profile</li>
          <li>Find and follow friends</li>
          <li>Create your first post</li>
        </ul>
        <p>If you have any questions, feel free to reach out to our support team.</p>
        <p>Best regards,<br>The Social Media App Team</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Email send error:', error);
    return false;
  }
};