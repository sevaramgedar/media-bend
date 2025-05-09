const Follow = require('../models/Follow');
const Chat = require('../models/Chat');
const Message = require('../models/Message');

class ChatHandler {
  constructor(io) {
    this.io = io;
    this.typingUsers = new Map(); // Store typing status
  }

  // Initialize chat handler
  initialize(socket) {
    this.setupMessageHandlers(socket);
    this.setupTypingHandlers(socket);
    this.setupReadStatusHandlers(socket);
  }

  // Setup message-related event handlers
  setupMessageHandlers(socket) {
    socket.on('send_message', async (data) => {
      try {
        const { chatId, content, attachments } = data;
        const chat = await this.validateChatAccess(socket, chatId);

        if (!chat) return;

        const message = await this.createMessage(chat, socket.user.id, content, attachments);
        await this.updateChatLastMessage(chat, message);
        await this.incrementUnreadCount(chat, socket.user.id);

        this.broadcastMessage(chat, message);
      } catch (error) {
        socket.emit('error', 'Error sending message');
      }
    });
  }

  // Setup typing status handlers
  setupTypingHandlers(socket) {
    socket.on('typing', (data) => {
      const { chatId } = data;
      this.handleTyping(socket, chatId, true);
    });

    socket.on('stop_typing', (data) => {
      const { chatId } = data;
      this.handleTyping(socket, chatId, false);
    });
  }

  // Setup read status handlers
  setupReadStatusHandlers(socket) {
    socket.on('mark_read', async (data) => {
      try {
        const { chatId } = data;
        const chat = await this.validateChatAccess(socket, chatId);

        if (!chat) return;

        await this.markMessagesAsRead(chat, socket.user.id);
        await this.resetUnreadCount(chat, socket.user.id);

        this.broadcastReadStatus(chat, socket.user.id);
      } catch (error) {
        socket.emit('error', 'Error marking messages as read');
      }
    });
  }

  // Validate chat access and mutual follow status
  async validateChatAccess(socket, chatId) {
    const chat = await Chat.findById(chatId);
    
    if (!chat) {
      socket.emit('error', 'Chat not found');
      return null;
    }

    if (!chat.participants.includes(socket.user.id)) {
      socket.emit('error', 'Not authorized to access this chat');
      return null;
    }

    // Check mutual follow status
    const otherParticipant = chat.participants.find(p => p.toString() !== socket.user.id);
    const mutualFollow = await this.checkMutualFollow(socket.user.id, otherParticipant);

    if (!mutualFollow) {
      socket.emit('error', 'You can only chat with mutual followers');
      return null;
    }

    return chat;
  }

  // Check if two users follow each other
  async checkMutualFollow(userId1, userId2) {
    const follow1 = await Follow.findOne({
      follower: userId1,
      following: userId2,
      status: 'accepted'
    });

    const follow2 = await Follow.findOne({
      follower: userId2,
      following: userId1,
      status: 'accepted'
    });

    return follow1 && follow2;
  }

  // Create new message
  async createMessage(chat, senderId, content, attachments = []) {
    const message = await Message.create({
      chat: chat._id,
      sender: senderId,
      content,
      attachments
    });

    await message.populate('sender', 'name username profilePhoto');
    return message;
  }

  // Update chat's last message
  async updateChatLastMessage(chat, message) {
    chat.lastMessage = message._id;
    await chat.save();
  }

  // Increment unread count for other participants
  async incrementUnreadCount(chat, senderId) {
    chat.participants.forEach(participantId => {
      if (participantId.toString() !== senderId) {
        const currentCount = chat.unreadCount.get(participantId.toString()) || 0;
        chat.unreadCount.set(participantId.toString(), currentCount + 1);
      }
    });
    await chat.save();
  }

  // Broadcast message to all participants
  broadcastMessage(chat, message) {
    chat.participants.forEach(participantId => {
      this.io.to(participantId.toString()).emit('new_message', {
        chatId: chat._id,
        message
      });
    });
  }

  // Handle typing status
  handleTyping(socket, chatId, isTyping) {
    const key = `${chatId}-${socket.user.id}`;
    
    if (isTyping) {
      this.typingUsers.set(key, Date.now());
      socket.to(chatId).emit('user_typing', {
        chatId,
        userId: socket.user.id,
        username: socket.user.username
      });
    } else {
      this.typingUsers.delete(key);
      socket.to(chatId).emit('user_stop_typing', {
        chatId,
        userId: socket.user.id
      });
    }
  }

  // Mark messages as read
  async markMessagesAsRead(chat, userId) {
    await Message.updateMany(
      {
        chat: chat._id,
        sender: { $ne: userId },
        readBy: { $ne: userId }
      },
      {
        $addToSet: { readBy: userId }
      }
    );
  }

  // Reset unread count for user
  async resetUnreadCount(chat, userId) {
    chat.unreadCount.set(userId.toString(), 0);
    await chat.save();
  }

  // Broadcast read status
  broadcastReadStatus(chat, userId) {
    chat.participants.forEach(participantId => {
      if (participantId.toString() !== userId) {
        this.io.to(participantId.toString()).emit('messages_read', {
          chatId: chat._id,
          userId
        });
      }
    });
  }
}

module.exports = ChatHandler;
