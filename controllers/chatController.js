const Chat = require('../models/Chat');
const Message = require('../models/Message');
const Follow = require('../models/Follow');
const { ErrorResponse } = require('../utils/errorHandler');

// @desc    Get or create chat with user
// @route   GET /api/chats/:userId
// @access  Private
exports.getOrCreateChat = async (req, res, next) => {
  try {
    // Check if users follow each other
    const followStatus = await Follow.findOne({
      follower: req.user.id,
      following: req.params.userId,
      status: 'accepted'
    });

    const followedByStatus = await Follow.findOne({
      follower: req.params.userId,
      following: req.user.id,
      status: 'accepted'
    });

    if (!followStatus || !followedByStatus) {
      return next(new ErrorResponse('You can only chat with mutual followers', 403));
    }

    // Find existing chat
    let chat = await Chat.findOne({
      participants: { $all: [req.user.id, req.params.userId] }
    }).populate('participants', 'name username profilePhoto');

    if (!chat) {
      // Create new chat
      chat = await Chat.create({
        participants: [req.user.id, req.params.userId],
        unreadCount: new Map([[req.user.id, 0], [req.params.userId, 0]])
      });

      await chat.populate('participants', 'name username profilePhoto');
    }

    res.status(200).json({
      success: true,
      data: chat
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's chats
// @route   GET /api/chats
// @access  Private
exports.getChats = async (req, res, next) => {
  try {
    const chats = await Chat.find({
      participants: req.user.id
    })
      .populate('participants', 'name username profilePhoto')
      .populate('lastMessage')
      .sort('-updatedAt');

    res.status(200).json({
      success: true,
      count: chats.length,
      data: chats
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get chat messages
// @route   GET /api/chats/:chatId/messages
// @access  Private
exports.getMessages = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const startIndex = (page - 1) * limit;

    const chat = await Chat.findById(req.params.chatId);

    if (!chat) {
      return next(new ErrorResponse('Chat not found', 404));
    }

    if (!chat.participants.includes(req.user.id)) {
      return next(new ErrorResponse('Not authorized to access this chat', 403));
    }

    const messages = await Message.find({
      chat: req.params.chatId
    })
      .populate('sender', 'name username profilePhoto')
      .sort('-createdAt')
      .skip(startIndex)
      .limit(limit);

    const total = await Message.countDocuments({
      chat: req.params.chatId
    });

    // Mark messages as read
    await Message.updateMany(
      {
        chat: req.params.chatId,
        sender: { $ne: req.user.id },
        readBy: { $ne: req.user.id }
      },
      {
        $addToSet: { readBy: req.user.id }
      }
    );

    // Reset unread count
    chat.unreadCount.set(req.user.id, 0);
    await chat.save();

    res.status(200).json({
      success: true,
      count: messages.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: messages
    });
  } catch (error) {
    next(error);
  }
}; 