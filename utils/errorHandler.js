// Error response handler
exports.errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;
  
    // Log to console for dev
    console.error(err);
  
    // Mongoose bad ObjectId
    if (err.name === 'CastError') {
      const message = `Resource not found`;
      return res.status(404).json({
        success: false,
        message
      });
    }
  
    // Mongoose duplicate key
    if (err.code === 11000) {
      let field = Object.keys(err.keyValue)[0];
      const message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
      return res.status(400).json({
        success: false,
        message
      });
    }
  
    // Mongoose validation error
    if (err.name === 'ValidationError') {
      const message = Object.values(err.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message
      });
    }
  
    // File upload size exceeded
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: `File size should be less than ${process.env.MAX_FILE_SIZE / 1000000} MB`
      });
    }
  
    // Default server error
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Server Error'
    });
  };