const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const ChatGroupSchema = new mongoose.Schema(
  {
    user1: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'users',
    },
    user2: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'users',
    },
    status: {
      type: Number,
      default: 1,
      enum: [
        1, // 1: Friend
        2, // 2: Unfriend
      ],
    },
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chat',
      default: null,
    },
    chatMessages: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Chat',
      },
    ],
    isVisited: {
      type: Boolean,
      default: false,
    },
    favorites: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Chat',
      },
    ],
    images: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Image',
      },
    ],
    audios: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Audio',
      },
    ],
    videos: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Video',
      },
    ],
    // unReadCount: [
    //   { user1: mongoose.Schema.Types.ObjectId, ref: 'users' },
    //   { user2: mongoose.Schema.Types.ObjectId, ref: 'users' },
    // ],
    user1Unread: { type: Number, default: 0 },
    user2Unread: { type: Number, default: 0 },
    currentStatus: {
      type: Number,
      default: 2,
      enum: [
        1, // 1: online
        2, // 2: away
      ],
    },
  },
  { timestamps: true }
);

function prePopulate(next) {
  this.populate('user1');
  this.populate('user2');
  next();
}

ChatGroupSchema.pre('find', prePopulate);
ChatGroupSchema.pre('findOne', prePopulate);
ChatGroupSchema.pre('findById', prePopulate);

ChatGroupSchema.plugin(mongoosePaginate);
// ChatGroupSchema.plugin(uniqueValidator, { message: "is already taken." });

module.exports = mongoose.model('ChatGroup', ChatGroupSchema);
