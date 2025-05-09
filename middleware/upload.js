const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const config = require('../config/config');

// Set storage engine
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, config.fileUpload.path);
  },
  filename: function (req, file, cb) {
    // Create unique filename: uuid + original extension
    cb(null, `${uuidv4()}${path.extname(file.originalname)}`);
  }
});

// Check file type
const fileFilter = (req, file, cb) => {
  // Allow images only
  if (file.mimetype.startsWith('image')) {
    return cb(null, true);
  } else {
    return cb(new Error('Only image files are allowed!'), false);
  }
};

// Initialize upload
const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(config.fileUpload.maxSize)
  },
  fileFilter: fileFilter
});

// Export middleware for different use cases
module.exports = {
  // For profile photo (single file)
  profilePhoto: upload.single('profilePhoto'),
  
  // For post images (multiple files, max 5)
  postImages: upload.array('images', 5)
};