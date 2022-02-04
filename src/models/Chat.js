const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const ChatSchema = new mongoose.Schema(
  {
    chatGroupID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ChatGroup',
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'users',
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'users',
    },
    reply: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chat',
    },
    isRead: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
    // isDeleted: [
    // 	{
    // 		type: mongoose.Schema.Types.ObjectId,
    // 		ref: "User",
    // 	},
    // ],
    text: { type: String, default: null },
    audios: { type: Array, default: null },
    images: { type: Array, default: null },
    videos: { type: Array, default: null },
    date: {
      type: Date,
      default: Date.now(),
    },
    isFav: { type: Boolean, default: false },
  },
  { timestamps: true }
);

function prePopulate(next) {
  this.populate('sender');
  this.populate('receiver');
  next();
}

ChatSchema.pre('find', prePopulate);
ChatSchema.pre('findOne', prePopulate);
ChatSchema.pre('findById', prePopulate);

ChatSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Chat', ChatSchema);
