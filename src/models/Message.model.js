const mongoose = require('mongoose');

const { Schema } = mongoose;

/* =============================================================================
 Message Schema
============================================================================= */
const MessageSchema = new Schema({
  conversationId: {
    type: Schema.Types.String,
    ref: 'conversation',
    required: [true, 'conversation id is required'],
  },
  text: { type: String },
  image: { type: String },
  user: {
    type: Schema.Types.String,
    ref: 'users',
    required: [true, 'user is required'],
  },
  seenBy: [{
    type: Schema.Types.String,
    ref: 'users',
    default: [],
  }],
  deleteUsers: [{
    type: Schema.Types.String,
    ref: 'users',
    default: [],
  }],
}, { timestamps: true });

/* =============================================================================
 Message Modal
============================================================================= */
const Message = mongoose.model('message', MessageSchema);

module.exports = Message;
