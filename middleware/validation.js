const { body, validationResult } = require('express-validator');

// Validation middleware
exports.validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }
  next();
};

// Validation rules for registration
exports.registerRules = [
  body('email')
    .if(body('mobile').not().exists())
    .isEmail()
    .withMessage('Please enter a valid email address'),
  
  body('mobile')
    .if(body('email').not().exists())
    .matches(/^[0-9]{10,15}$/)
    .withMessage('Please enter a valid mobile number'),
  
  // Require either email or mobile
  body()
    .custom((value, { req }) => {
      if (!req.body.email && !req.body.mobile) {
        throw new Error('Either email or mobile is required');
      }
      return true;
    })
];

// Validation rules for login
exports.loginRules = [
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  
  // Require either email or mobile
  body()
    .custom((value, { req }) => {
      if (!req.body.email && !req.body.mobile) {
        throw new Error('Either email or mobile is required');
      }
      return true;
    })
];

// Validation rules for OTP verification
exports.otpVerificationRules = [
  body('otp')
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage('OTP must be 6 digits'),
  
  // Require either email or mobile
  body()
    .custom((value, { req }) => {
      if (!req.body.email && !req.body.mobile) {
        throw new Error('Either email or mobile is required');
      }
      return true;
    })
];

// Validation rules for password setting
exports.passwordRules = [
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match');
      }
      return true;
    })
];

// Validation rules for user profile update
exports.userProfileRules = [
  body('name')
    .if(body('name').exists())
    .notEmpty()
    .withMessage('Name is required'),
  
  body('username')
    .if(body('username').exists())
    .isLength({ min: 3 })
    .withMessage('Username must be at least 3 characters')
    .matches(/^[a-zA-Z0-9_\.]+$/)
    .withMessage('Username can only contain letters, numbers, underscores and dots'),
  
  body('dob')
    .if(body('dob').exists())
    .isISO8601()
    .withMessage('Date of birth must be a valid date'),
  
  body('bio')
    .if(body('bio').exists())
    .isLength({ max: 500 })
    .withMessage('Bio cannot exceed 500 characters')
];

// Validation rules for post creation
exports.postRules = [
  body('content')
    .notEmpty()
    .withMessage('Post content is required')
    .isLength({ max: 1000 })
    .withMessage('Post content cannot exceed 1000 characters')
];

// Validation rules for comment creation
exports.commentRules = [
  body('content')
    .notEmpty()
    .withMessage('Comment content is required')
    .isLength({ max: 300 })
    .withMessage('Comment cannot exceed 300 characters')
];

// Validation rules for message creation
exports.messageRules = [
  body('content')
    .notEmpty()
    .withMessage('Message content is required')
];