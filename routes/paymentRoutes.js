const express = require('express');
const router = express.Router();
const { initiatePayment, verifyPaymentSignature } = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

// Create a new payment order
router.post('/create-order', protect, initiatePayment);

// Verify payment signature
router.post('/verify-payment', protect, verifyPaymentSignature);

module.exports = router; 