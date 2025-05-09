// Format success response
exports.formatSuccess = (res, data, statusCode = 200) => {
    return res.status(statusCode).json({
      success: true,
      data
    });
  };
  
  // Format error response
  exports.formatError = (res, message, statusCode = 400) => {
    return res.status(statusCode).json({
      success: false,
      message
    });
  };