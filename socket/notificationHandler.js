class NotificationHandler {
  constructor(io) {
    this.io = io;
    this.notificationTypes = {
      FOLLOW_REQUEST: 'follow-request',
      FOLLOW_ACCEPTED: 'follow-accepted',
      POST_LIKED: 'post-liked',
      NEW_COMMENT: 'new-comment',
      MESSAGE_RECEIVED: 'message-received'
    };
  }

  // Initialize notification handler
  initialize(socket) {
    // Join user's notification room
    socket.join(`notifications:${socket.user.id}`);
  }

  // Send follow request notification
  async sendFollowRequestNotification(followerId, followingId) {
    const notification = {
      type: this.notificationTypes.FOLLOW_REQUEST,
      from: followerId,
      to: followingId,
      message: 'sent you a follow request',
      timestamp: new Date()
    };

    this.io.to(`notifications:${followingId}`).emit('notification', notification);
  }

  // Send follow accepted notification
  async sendFollowAcceptedNotification(followerId, followingId) {
    const notification = {
      type: this.notificationTypes.FOLLOW_ACCEPTED,
      from: followingId,
      to: followerId,
      message: 'accepted your follow request',
      timestamp: new Date()
    };

    this.io.to(`notifications:${followerId}`).emit('notification', notification);
  }

  // Send post liked notification
  async sendPostLikedNotification(userId, postId, likedBy) {
    const notification = {
      type: this.notificationTypes.POST_LIKED,
      from: likedBy,
      to: userId,
      postId,
      message: 'liked your post',
      timestamp: new Date()
    };

    this.io.to(`notifications:${userId}`).emit('notification', notification);
  }

  // Send new comment notification
  async sendNewCommentNotification(userId, postId, commentId, commentedBy) {
    const notification = {
      type: this.notificationTypes.NEW_COMMENT,
      from: commentedBy,
      to: userId,
      postId,
      commentId,
      message: 'commented on your post',
      timestamp: new Date()
    };

    this.io.to(`notifications:${userId}`).emit('notification', notification);
  }

  // Send message received notification
  async sendMessageNotification(chatId, senderId, receiverId) {
    const notification = {
      type: this.notificationTypes.MESSAGE_RECEIVED,
      from: senderId,
      to: receiverId,
      chatId,
      message: 'sent you a message',
      timestamp: new Date()
    };

    this.io.to(`notifications:${receiverId}`).emit('notification', notification);
  }

  // Mark notification as read
  async markNotificationAsRead(userId, notificationId) {
    // Implement notification read status update logic here
    // This could involve updating a notification collection in the database
  }

  // Get user's unread notifications
  async getUnreadNotifications(userId) {
    // Implement fetching unread notifications logic here
    // This could involve querying a notification collection in the database
  }

  // Clear all notifications for a user
  async clearNotifications(userId) {
    // Implement clearing all notifications logic here
    // This could involve updating a notification collection in the database
  }
}

module.exports = NotificationHandler;
