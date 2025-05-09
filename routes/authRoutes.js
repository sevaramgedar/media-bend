const express = require('express');
const router = express.Router();
const {
  register,
  verifyOTP,
  setPassword,
  login,
  getMe,
  logout
} = require('../controllers/authController');
const {
  registerRules,
  loginRules,
  otpVerificationRules,
  passwordRules,
  validate
} = require('../middleware/validation');
const { protect } = require('../middleware/auth');

// Public routes
router.post('/register', registerRules, validate, register);
router.post('/verify-otp', otpVerificationRules, validate, verifyOTP);
router.post('/set-password', passwordRules, validate, setPassword);
router.post('/login', loginRules, validate, login);

// Protected routes
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);

module.exports = router;