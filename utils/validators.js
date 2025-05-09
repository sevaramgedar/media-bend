const { body, param, validationResult } = require('express-validator');

// Validation middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Email validation
const emailValidation = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail()
];

// Mobile number validation
const mobileValidation = [
  body('mobile')
    .matches(/^[0-9]{10,15}$/)
    .withMessage('Please provide a valid mobile number')
];

// Password validation
const passwordValidation = [
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
];

// Username validation
const usernameValidation = [
  body('username')
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores')
];

// Profile completion validation
const profileCompletionValidation = [
  body('name')
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .trim(),

  body('dob')
    .isISO8601()
    .withMessage('Please provide a valid date of birth')
    .custom((value) => {
      const age = new Date().getFullYear() - new Date(value).getFullYear();
      if (age < 13) {
        throw new Error('You must be at least 13 years old');
      }
      return true;
    }),

  body('bio')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Bio cannot be more than 500 characters')
    .trim(),

  body('address')
    .optional()
    .isObject()
    .withMessage('Address must be an object'),

  body('address.street')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Street address cannot be more than 100 characters')
    .trim(),

  body('address.city')
    .optional()
    .isLength({ max: 50 })
    .withMessage('City name cannot be more than 50 characters')
    .trim(),

  body('address.state')
    .optional()
    .isLength({ max: 50 })
    .withMessage('State name cannot be more than 50 characters')
    .trim(),

  body('address.zipCode')
    .optional()
    .matches(/^[0-9]{5,10}$/)
    .withMessage('Please provide a valid zip code'),

  body('country')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Country name cannot be more than 50 characters')
    .trim()
];

// Post content validation
const postContentValidation = [
  body('content')
    .isLength({ min: 1, max: 1000 })
    .withMessage('Post content must be between 1 and 1000 characters')
    .trim(),

  body('images')
    .optional()
    .isArray()
    .withMessage('Images must be an array')
    .custom((value) => {
      if (value && value.length > 5) {
        throw new Error('Maximum 5 images allowed per post');
      }
      return true;
    })
];

// Comment content validation
const commentContentValidation = [
  body('content')
    .isLength({ min: 1, max: 500 })
    .withMessage('Comment must be between 1 and 500 characters')
    .trim(),

  body('parentComment')
    .optional()
    .isMongoId()
    .withMessage('Invalid parent comment ID')
];

// Message content validation
const messageContentValidation = [
  body('content')
    .isLength({ min: 1, max: 1000 })
    .withMessage('Message must be between 1 and 1000 characters')
    .trim(),

  body('attachments')
    .optional()
    .isArray()
    .withMessage('Attachments must be an array')
    .custom((value) => {
      if (value && value.length > 5) {
        throw new Error('Maximum 5 attachments allowed per message');
      }
      return true;
    })
];

module.exports = {
  validate,
  emailValidation,
  mobileValidation,
  passwordValidation,
  usernameValidation,
  profileCompletionValidation,
  postContentValidation,
  commentContentValidation,
  messageContentValidation
};
