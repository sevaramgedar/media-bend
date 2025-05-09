const User = require('../models/User');
const Follow = require('../models/Follow');
const { ErrorResponse } = require('../utils/errorHandler');

// @desc    Get all users (paginated)
// @route   GET /api/users
// @access  Private
exports.getUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;

    const users = await User.find()
      .select('-password')
      .skip(startIndex)
      .limit(limit);

    const total = await User.countDocuments();

    res.status(200).json({
      success: true,
      count: users.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: users
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Send follow request
// @route   POST /api/users/:id/follow
// @access  Private
exports.sendFollowRequest = async (req, res, next) => {
  try {
    const userToFollow = await User.findById(req.params.id);
    
    if (!userToFollow) {
      return next(new ErrorResponse('User not found', 404));
    }

    if (req.user.id === req.params.id) {
      return next(new ErrorResponse('You cannot follow yourself', 400));
    }

    const existingFollow = await Follow.findOne({
      follower: req.user.id,
      following: req.params.id
    });

    if (existingFollow) {
      return next(new ErrorResponse('Follow request already exists', 400));
    }

    const follow = await Follow.create({
      follower: req.user.id,
      following: req.params.id
    });

    res.status(201).json({
      success: true,
      data: follow
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Accept/Reject follow request
// @route   PUT /api/users/:id/follow
// @access  Private
exports.handleFollowRequest = async (req, res, next) => {
  try {
    const { status } = req.body;
    
    if (!['accepted', 'rejected'].includes(status)) {
      return next(new ErrorResponse('Invalid status', 400));
    }

    const follow = await Follow.findOne({
      follower: req.params.id,
      following: req.user.id,
      status: 'pending'
    });

    if (!follow) {
      return next(new ErrorResponse('Follow request not found', 404));
    }

    follow.status = status;
    await follow.save();

    res.status(200).json({
      success: true,
      data: follow
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's followers
// @route   GET /api/users/:id/followers
// @access  Private
exports.getFollowers = async (req, res, next) => {
  try {
    const followers = await Follow.find({
      following: req.params.id,
      status: 'accepted'
    }).populate('follower', 'name username profilePhoto');

    res.status(200).json({
      success: true,
      count: followers.length,
      data: followers
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's following
// @route   GET /api/users/:id/following
// @access  Private
exports.getFollowing = async (req, res, next) => {
  try {
    const following = await Follow.find({
      follower: req.params.id,
      status: 'accepted'
    }).populate('following', 'name username profilePhoto');

    res.status(200).json({
      success: true,
      count: following.length,
      data: following
    });
  } catch (error) {
    next(error);
  }
};
