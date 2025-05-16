const express = require('express');
const router = express.Router();
const { uploadSingle, uploadMultiple } = require('../middleware/upload');
const { processUploadedFile } = require('../services/fileService');
const { protect } = require('../middleware/auth');

// Upload single file (e.g., profile photo)
router.post('/upload-single', 
  protect,
  uploadSingle('file'),
  async (req, res) => {
    try {
      const fileData = processUploadedFile(req.file);
      res.status(200).json({
        success: true,
        data: fileData
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

// Upload multiple files (e.g., post images)
router.post('/upload-multiple',
  protect,
  uploadMultiple('files', 5),
  async (req, res) => {
    try {
      const filesData = req.files.map(file => processUploadedFile(file));
      res.status(200).json({
        success: true,
        data: filesData
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

// Get temporary URL for a file
router.get('/get-url/:fileKey',
  protect,
  async (req, res) => {
    try {
      const { fileKey } = req.params;
      const url = await getFileUrl(fileKey);
      
      if (!url) {
        return res.status(404).json({
          success: false,
          message: 'File not found'
        });
      }

      res.status(200).json({
        success: true,
        data: { url }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

module.exports = router;