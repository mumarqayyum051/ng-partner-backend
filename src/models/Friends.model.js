const mongoose = require('mongoose');

const { Schema } = mongoose;

const statusValidator = (status) => {
  const statuses = ['pending', 'accepted', 'rejected'];

  return statuses.includes(status);
};

/* =============================================================================
 Friends Schema
============================================================================= */
const FriendsSchema = new Schema({
  friend: {
    ref: 'users',
    type: Schema.Types.ObjectId,
    required: [true, 'friend is required'],
  },
  status: {
    type: String,
    default: 'pending',
    validate: [statusValidator, 'Please provide a valid status'],
  },
  requestBy: {
    ref: 'users',
    type: Schema.Types.ObjectId,
    required: [true, 'requestBy is required'],
  },
  user: {
    ref: 'users',
    type: Schema.Types.ObjectId,
    required: [true, 'user is required'],
  },
}, { timestamps: true });

/* =============================================================================
 Friends Modal
============================================================================= */
const Friends = mongoose.model('friends', FriendsSchema);
module.exports = Friends;
