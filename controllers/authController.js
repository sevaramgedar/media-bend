const User = require('../models/User');
const { asyncHandler } = require('../utils/asyncHandler');
const { formatSuccess, formatError } = require('../utils/responseFormatter');
const emailService = require('../services/emailService');
const smsService = require('../services/smsService');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = asyncHandler(async (req, res) => {
  const { email, mobile } = req.body;

  // Check if user already exists
  let user = null;
  
  if (email) {
    user = await User.findOne({ email });
  } else if (mobile) {
    user = await User.findOne({ mobile });
  }

  if (user) {
    // If user exists but not verified
    if ((email && !user.isEmailVerified) || (mobile && !user.isMobileVerified)) {
      // Generate and send new OTP
      let otp;
      if (email) {
        otp = user.generateEmailOTP();
        await user.save();
        await emailService.sendOtpEmail(email, otp);
      } else if (mobile) {
        otp = user.generateMobileOTP();
        await user.save();
        await smsService.sendOtpSMS(mobile, otp);
      }
      
      return formatSuccess(res, {
        message: `OTP sent to your ${email ? 'email' : 'mobile'}. Please verify to continue.`
      });
    }
    
    return formatError(res, `User with this ${email ? 'email' : 'mobile'} already exists`);
  }

  // Create new user
  user = new User({
    email,
    mobile,
    // Don't set password yet - will be set after OTP verification
  });

  // Generate and send OTP
  let otp;
  if (email) {
    otp = user.generateEmailOTP();
    await user.save();
    await emailService.sendOtpEmail(email, otp);
  } else if (mobile) {
    otp = user.generateMobileOTP();
    await user.save();
    await smsService.sendOtpSMS(mobile, otp);
  }

  return formatSuccess(res, {
    message: `OTP sent to your ${email ? 'email' : 'mobile'}. Please verify to continue.`
  }, 201);
});

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
// @access  Public
exports.verifyOTP = asyncHandler(async (req, res) => {
  const { email, mobile, otp } = req.body;

  // Get user
  let user = null;
  if (email) {
    user = await User.findOne({ 
      email,
      emailVerificationExpire: { $gt: Date.now() }
    });
  } else if (mobile) {
    user = await User.findOne({ 
      mobile,
      mobileVerificationExpire: { $gt: Date.now() }
    });
  }

  if (!user) {
    return formatError(res, 'Invalid or expired OTP', 400);
  }

  // Verify OTP
  const isMatch = await user.matchOTP(otp, email ? 'email' : 'mobile');
  if (!isMatch) {
    return formatError(res, 'Invalid OTP', 400);
  }

  // Mark as verified
  if (email) {
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpire = undefined;
  } else if (mobile) {
    user.isMobileVerified = true;
    user.mobileVerificationOTP = undefined;
    user.mobileVerificationExpire = undefined;
  }

  await user.save();

  return formatSuccess(res, {
    message: `Your ${email ? 'email' : 'mobile'} has been verified. Please set your password.`
  });
});

// @desc    Set password after OTP verification
// @route   POST /api/auth/set-password
// @access  Public
exports.setPassword = asyncHandler(async (req, res) => {
  const { email, mobile, password } = req.body;

  // Find user
  let user = null;
  if (email) {
    user = await User.findOne({ email, isEmailVerified: true });
  } else if (mobile) {
    user = await User.findOne({ mobile, isMobileVerified: true });
  }

  if (!user) {
    return formatError(res, `User with this ${email ? 'email' : 'mobile'} not found or not verified`, 404);
  }

  // Set password
  user.password = password;
  await user.save();

  // Send welcome message
  if (email) {
    await emailService.sendWelcomeEmail(email, user.name);
  } else if (mobile) {
    await smsService.sendWelcomeSMS(mobile, user.name);
  }

  // Generate token
  const token = user.getSignedJwtToken();

  return formatSuccess(res, {
    message: 'Password set successfully',
    token,
    user: {
      _id: user._id,
      email: user.email,
      mobile: user.mobile,
      name: user.name,
      isProfileComplete: user.isProfileComplete
    }
  });
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res) => {
  const { email, mobile, password } = req.body;

  // Find user
  let user = null;
  if (email) {
    user = await User.findOne({ email }).select('+password');
  } else if (mobile) {
    user = await User.findOne({ mobile }).select('+password');
  }

  if (!user) {
    return formatError(res, 'Invalid credentials', 401);
  }

  // Check if email/mobile is verified
  if ((email && !user.isEmailVerified) || (mobile && !user.isMobileVerified)) {
    return formatError(res, `Please verify your ${email ? 'email' : 'mobile'} first`, 401);
  }

  // Check if password matches
  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    return formatError(res, 'Invalid credentials', 401);
  }

  // Update last active
  user.lastActive = Date.now();
  user.online = true;
  await user.save({ validateBeforeSave: false });

  // Generate token
  const token = user.getSignedJwtToken();

  return formatSuccess(res, {
    token,
    user: {
      _id: user._id,
      email: user.email,
      mobile: user.mobile,
      name: user.name,
      profilePhoto: user.profilePhoto,
      username: user.username,
      isProfileComplete: user.isProfileComplete
    }
  });
});

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);

  return formatSuccess(res, { user });
});

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
exports.logout = asyncHandler(async (req, res) => {
  // Update user status
  req.user.online = false;
  await req.user.save({ validateBeforeSave: false });

  return formatSuccess(res, { message: 'Logged out successfully' });
});