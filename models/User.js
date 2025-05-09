const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config/config');

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email',
    ],
    sparse: true, // Allows null but enforces uniqueness when present
    index: true,
  },
  mobile: {
    type: String,
    match: [/^[0-9]{10,15}$/, 'Please provide a valid mobile number'],
    sparse: true, // Allows null but enforces uniqueness when present
    index: true,
  },
  password: {
    type: String,
    required: [false, 'Please add a password'],
    minlength: 6,
    select: false, // Don't return password in queries
  },
  name: {
    type: String,
    trim: true,
  },
  username: {
    type: String,
    unique: true,
    sparse: true, // Allows null but enforces uniqueness when present
    trim: true,
  },
  dob: {
    type: Date,
  },
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot be more than 500 characters'],
  },
  profilePhoto: {
    type: String, // URL to profile photo
    default: 'default-profile.jpg',
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
  },
  country: String,
  isProfileComplete: {
    type: Boolean,
    default: false,
  },
  isEmailVerified: {
    type: Boolean,
    default: false,
  },
  isMobileVerified: {
    type: Boolean,
    default: false,
  },
  emailVerificationToken: String,
  mobileVerificationOTP: String,
  emailVerificationExpire: Date,
  mobileVerificationExpire: Date,
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  lastActive: {
    type: Date,
    default: Date.now,
  },
  online: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

// Email & Mobile uniqueness constraint
UserSchema.index({ email: 1 }, { 
  unique: true, 
  partialFilterExpression: { email: { $exists: true, $ne: null } }
});

UserSchema.index({ mobile: 1 }, { 
  unique: true, 
  partialFilterExpression: { mobile: { $exists: true, $ne: null } }
});

// Ensure user has either email or mobile
UserSchema.pre('save', function (next) {
  if (!this.email && !this.mobile) {
    return next(new Error('User must have either email or mobile'));
  }
  next();
});

// Encrypt password using bcrypt
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Sign JWT and return
UserSchema.methods.getSignedJwtToken = function () {
  return jwt.sign({ id: this._id }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
};

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate and hash OTP for mobile verification
UserSchema.methods.generateMobileOTP = function () {
  // Generate 6 digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Hash the OTP
  const salt = bcrypt.genSaltSync(10);
  this.mobileVerificationOTP = bcrypt.hashSync(otp, salt);
  
  // Set expiry (10 minutes)
  this.mobileVerificationExpire = Date.now() + config.otp.expiresIn;
  
  return otp;
};

// Generate and hash OTP for email verification
UserSchema.methods.generateEmailOTP = function () {
  // Generate 6 digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Hash the OTP
  const salt = bcrypt.genSaltSync(10);
  this.emailVerificationToken = bcrypt.hashSync(otp, salt);
  
  // Set expiry (10 minutes)
  this.emailVerificationExpire = Date.now() + config.otp.expiresIn;
  
  return otp;
};

// Match OTPs
UserSchema.methods.matchOTP = async function (enteredOTP, type) {
  if (type === 'email') {
    return await bcrypt.compare(enteredOTP, this.emailVerificationToken);
  } else if (type === 'mobile') {
    return await bcrypt.compare(enteredOTP, this.mobileVerificationOTP);
  }
  return false;
};

module.exports = mongoose.model('User', UserSchema);