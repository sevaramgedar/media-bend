const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Follow = require('../models/Follow');
const { ErrorResponse } = require('../utils/errorHandler');

// @desc    Create a post
// @route   POST /api/posts
// @access  Private
exports.createPost = async (req, res, next) => {
  try {
    const { content, images } = req.body;

    const post = await Post.create({
      user: req.user.id,
      content,
      images: images || []
    });

    res.status(201).json({
      success: true,
      data: post
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all posts (from followed users)
// @route   GET /api/posts
// @access  Private
exports.getPosts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;

    // Get IDs of users that the current user follows
    const following = await Follow.find({
      follower: req.user.id,
      status: 'accepted'
    }).select('following');

    const followingIds = following.map(f => f.following);
    followingIds.push(req.user.id); // Include user's own posts

    const posts = await Post.find({
      user: { $in: followingIds }
    })
      .populate('user', 'name username profilePhoto')
      .populate('comments')
      .sort('-createdAt')
      .skip(startIndex)
      .limit(limit);

    const total = await Post.countDocuments({
      user: { $in: followingIds }
    });

    res.status(200).json({
      success: true,
      count: posts.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: posts
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Like/Unlike a post
// @route   PUT /api/posts/:id/like
// @access  Private
exports.toggleLike = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return next(new ErrorResponse('Post not found', 404));
    }

    // Check if user has already liked the post
    const likeIndex = post.likes.indexOf(req.user.id);

    if (likeIndex > -1) {
      // Unlike
      post.likes.splice(likeIndex, 1);
    } else {
      // Like
      post.likes.push(req.user.id);
    }

    await post.save();

    res.status(200).json({
      success: true,
      data: post
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add comment to post
// @route   POST /api/posts/:id/comments
// @access  Private
exports.addComment = async (req, res, next) => {
  try {
    const { content, parentComment } = req.body;

    const post = await Post.findById(req.params.id);

    if (!post) {
      return next(new ErrorResponse('Post not found', 404));
    }

    const comment = await Comment.create({
      post: req.params.id,
      user: req.user.id,
      content,
      parentComment
    });

    post.comments.push(comment._id);
    await post.save();

    await comment.populate('user', 'name username profilePhoto');

    res.status(201).json({
      success: true,
      data: comment
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get post comments
// @route   GET /api/posts/:id/comments
// @access  Private
exports.getComments = async (req, res, next) => {
  try {
    const comments = await Comment.find({
      post: req.params.id,
      parentComment: null // Only get top-level comments
    })
      .populate('user', 'name username profilePhoto')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: comments.length,
      data: comments
    });
  } catch (error) {
    next(error);
  }
};
