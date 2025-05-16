const { upload, deleteFile, getSignedUrl } = require('../config/s3');

// Handle single file upload
const uploadSingleFile = (fieldName) => {
  return upload.single(fieldName);
};

// Handle multiple file uploads
const uploadMultipleFiles = (fieldName, maxCount = 5) => {
  return upload.array(fieldName, maxCount);
};

// Delete file from S3
const removeFile = async (fileKey) => {
  return await deleteFile(fileKey);
};

// Get temporary access URL for file
const getFileUrl = async (fileKey, expiresIn = 3600) => {
  return await getSignedUrl(fileKey, expiresIn);
};

// Process uploaded file data
const processUploadedFile = (file) => {
  if (!file) return null;
  
  return {
    key: file.key,
    location: file.location,
    originalName: file.originalname,
    mimeType: file.mimetype,
    size: file.size
  };
};

module.exports = {
  uploadSingleFile,
  uploadMultipleFiles,
  removeFile,
  getFileUrl,
  processUploadedFile
};