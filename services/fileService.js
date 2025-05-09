const fs = require('fs');
const path = require('path');
const config = require('../config/config');

// Get file URL
exports.getFileUrl = (filename) => {
  if (!filename) return null;
  // In production, this would be a CDN URL
  return `/uploads/${filename}`;
};

// Delete file
exports.deleteFile = async (filename) => {
  if (!filename) return false;
  
  try {
    const filePath = path.join(config.fileUpload.path, filename);
    // Check if file exists
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    return true;
  } catch (error) {
    console.error('File delete error:', error);
    return false;
  }
};

// Process uploaded files and return array of filenames
exports.processUploadedFiles = (files) => {
  if (!files) return [];
  
  // Handle single file
  if (!Array.isArray(files)) {
    return [files.filename];
  }
  
  // Handle multiple files
  return files.map(file => file.filename);
};