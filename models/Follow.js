const mongoose = require('mongoose');

const FollowSchema = new mongoose.Schema({
  // User who is following
  follower: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // User who is being followed
  following: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Status of the follow request
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index to ensure unique follow relationships
FollowSchema.index({ follower: 1, following: 1 }, { unique: true });

// Create indexes for faster queries
FollowSchema.index({ follower: 1, status: 1 });
FollowSchema.index({ following: 1, status: 1 });

module.exports = mongoose.model('Follow', FollowSchema);