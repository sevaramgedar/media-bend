const { uploadSingleFile, uploadMultipleFiles } = require('../services/fileService');

// Middleware for single file upload
const uploadSingle = (fieldName) => {
  return (req, res, next) => {
    uploadSingleFile(fieldName)(req, res, (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message
        });
      }
      next();
    });
  };
};

// Middleware for multiple file upload
const uploadMultiple = (fieldName, maxCount = 5) => {
  return (req, res, next) => {
    uploadMultipleFiles(fieldName, maxCount)(req, res, (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message
        });
      }
      next();
    });
  };
};

module.exports = {
  uploadSingle,
  uploadMultiple
};