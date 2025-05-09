const User = require('../models/User');
const Chat = require('../models/Chat');
const Message = require('../models/Message');
const jwt = require('jsonwebtoken');
const config = require('../config/config');

// Store connected users
const connectedUsers = new Map();

const setupSocket = (io) => {
  // Middleware for authentication
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, config.jwt.secret);
      const user = await User.findById(decoded.id);

      if (!user) {
        return next(new Error('User not found'));
      }

      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.username}`);

    // Update user's online status
    User.findByIdAndUpdate(socket.user.id, {
      online: true,
      lastActive: Date.now()
    }).exec();

    // Join user's personal room
    socket.join(socket.user.id);

    // Handle new message
    socket.on('send_message', async (data) => {
      try {
        const { chatId, content, attachments } = data;

        const chat = await Chat.findById(chatId);
        
        if (!chat) {
          return socket.emit('error', 'Chat not found');
        }

        if (!chat.participants.includes(socket.user.id)) {
          return socket.emit('error', 'Not authorized to send messages in this chat');
        }

        const message = await Message.create({
          chat: chatId,
          sender: socket.user.id,
          content,
          attachments: attachments || []
        });

        await message.populate('sender', 'name username profilePhoto');

        // Update chat's last message
        chat.lastMessage = message._id;
        
        // Increment unread count for other participants
        chat.participants.forEach(participantId => {
          if (participantId.toString() !== socket.user.id) {
            const currentCount = chat.unreadCount.get(participantId.toString()) || 0;
            chat.unreadCount.set(participantId.toString(), currentCount + 1);
          }
        });

        await chat.save();

        // Emit message to all participants
        chat.participants.forEach(participantId => {
          io.to(participantId.toString()).emit('new_message', {
            chatId,
            message
          });
        });
      } catch (error) {
        socket.emit('error', 'Error sending message');
      }
    });

    // Handle typing status
    socket.on('typing', (data) => {
      const { chatId } = data;
      socket.to(chatId).emit('user_typing', {
        chatId,
        userId: socket.user.id,
        username: socket.user.username
      });
    });

    // Handle stop typing
    socket.on('stop_typing', (data) => {
      const { chatId } = data;
      socket.to(chatId).emit('user_stop_typing', {
        chatId,
        userId: socket.user.id
      });
    });

    // Handle disconnect
    socket.on('disconnect', async () => {
      console.log(`User disconnected: ${socket.user.username}`);
      
      // Update user's online status
      await User.findByIdAndUpdate(socket.user.id, {
        online: false,
        lastActive: Date.now()
      }).exec();

      // Notify other users
      socket.broadcast.emit('user_offline', {
        userId: socket.user.id
      });
    });
  });

  return io;
};

module.exports = setupSocket;

// Update user online status
async function updateUserStatus(userId, status) {
  try {
    await User.findByIdAndUpdate(userId, {
      online: status,
      lastActive: Date.now()
    });
  } catch (error) {
    console.error(`Error updating user status: ${error.message}`);
  }
}

// Check if user is following another user
async function isUserFollowing(userId, targetId) {
  try {
    const user = await User.findById(userId);
    const target = await User.findById(targetId);
    
    if (!user || !target) {
      return false;
    }
    
    // This would be replaced with a real follow check
    const Follow = require('../models/Follow');
    
    // Check if both users follow each other
    const userFollowsTarget = await Follow.findOne({
      follower: userId,
      following: targetId,
      status: 'accepted'
    });
    
    const targetFollowsUser = await Follow.findOne({
      follower: targetId,
      following: userId,
      status: 'accepted'
    });
    
    return userFollowsTarget && targetFollowsUser;
  } catch (error) {
    console.error(`Error checking follow status: ${error.message}`);
    return false;
  }
}