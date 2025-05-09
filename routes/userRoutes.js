const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getUsers,
  sendFollowRequest,
  handleFollowRequest,
  getFollowers,
  getFollowing
} = require('../controllers/userController');

// Get all users (paginated)
router.get('/', protect, getUsers);

// Follow user
router.post('/:id/follow', protect, sendFollowRequest);

// Handle follow request
router.put('/:id/follow', protect, handleFollowRequest);

// Get user's followers
router.get('/:id/followers', protect, getFollowers);

// Get user's following
router.get('/:id/following', protect, getFollowing);

module.exports = router;
