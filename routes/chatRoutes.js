const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getOrCreateChat,
  getChats,
  getMessages
} = require('../controllers/chatController');

// Get or create chat with user
router.get('/:userId', protect, getOrCreateChat);

// Get user's chats
router.get('/', protect, getChats);

// Get chat messages
router.get('/:chatId/messages', protect, getMessages);

module.exports = router;
