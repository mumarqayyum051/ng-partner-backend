const mongoose = require('mongoose');

const { Schema } = mongoose;

/* =============================================================================
 Conversation Schema
============================================================================= */
const ConversationSchema = new Schema({
  participants: [{
    type: Schema.Types.String,
    ref: 'users',
  }],
  messageCounters: {
    type: Array,
    default: [],
  },
  lastMessage: {
    type: Schema.Types.String,
    ref: 'message',
  },
  type: {
    type: String,
    default: 'one-to-one',
  },
}, { timestamps: true });

/* =============================================================================
 Conversation Modal
============================================================================= */
const Conversation = mongoose.model('conversation', ConversationSchema);

module.exports = Conversation;
