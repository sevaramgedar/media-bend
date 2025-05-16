const { createOrder, verifyPayment } = require('../services/paymentService');
const { asyncHandler } = require('../utils/asyncHandler');

const initiatePayment = asyncHandler(async (req, res) => {
  const { amount, receipt } = req.body;

  if (!amount || !receipt) {
    return res.status(400).json({
      success: false,
      message: 'Amount and receipt are required'
    });
  }

  const order = await createOrder(amount, receipt);
  
  res.status(200).json({
    success: true,
    data: order
  });
});

const verifyPaymentSignature = asyncHandler(async (req, res) => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    return res.status(400).json({
      success: false,
      message: 'Missing required payment verification parameters'
    });
  }

  const isValid = verifyPayment(razorpayOrderId, razorpayPaymentId, razorpaySignature);

  if (!isValid) {
    return res.status(400).json({
      success: false,
      message: 'Invalid payment signature'
    });
  }

  res.status(200).json({
    success: true,
    message: 'Payment verified successfully'
  });
});

module.exports = {
  initiatePayment,
  verifyPaymentSignature
}; 