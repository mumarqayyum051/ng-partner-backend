const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const UnreadCountSchema = new mongoose.Schema(
  {
    chatGroupID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ChatGroup',
    },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
    count: { type: Number, default: 0 },
  },
  { timestamps: true }
);

function prePopulate(next) {
  this.populate('sender');
  this.populate('receiver');
  next();
}

UnreadCountSchema.pre('find', prePopulate);
UnreadCountSchema.pre('findOne', prePopulate);
UnreadCountSchema.pre('findById', prePopulate);

UnreadCountSchema.plugin(mongoosePaginate);
// UnreadCountSchema.plugin(uniqueValidator, { message: "is already taken." });

module.exports = mongoose.model('UnreadCount', UnreadCountSchema);
