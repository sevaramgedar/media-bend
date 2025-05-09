const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  createPost,
  getPosts,
  toggleLike,
  addComment,
  getComments
} = require('../controllers/postController');

// Create post
router.post('/', protect, createPost);

// Get all posts (from followed users)
router.get('/', protect, getPosts);

// Like/Unlike post
router.put('/:id/like', protect, toggleLike);

// Add comment to post
router.post('/:id/comments', protect, addComment);

// Get post comments
router.get('/:id/comments', protect, getComments);

module.exports = router;
