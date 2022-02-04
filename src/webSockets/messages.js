/* eslint-disable consistent-return, object-curly-newline, no-console */

const Joi = require('@hapi/joi');
const SocketIO = require('./config');
const ConversationSocket = require('./conversations');

const { ConversationModel, MessageModel, UserModel } = require('../models');

module.exports = SocketIO.of('/messages').on('connection', (socket) => {
  // join user by conversation id
  socket.join(socket.handshake.query.conversationId);

  /**
   * when someone send message
   */
  socket.on('new_message', async (data) => {
    try {
      const validationSchema = Joi.object({
        text: Joi.string(),
        image: Joi.string(),
        user: Joi.string().required(),
        conversationId: Joi.string().required(),
      });

      await validationSchema.validateAsync(data);

      const { text, image, user, conversationId } = data;

      // getting conversation details
      const conversation = await ConversationModel.findById(conversationId);

      // create new message
      const newMessage = { text, image, user, seenBy: [user], conversationId };

      // create new message on the database
      const _message = await MessageModel.create(newMessage);

      // get user details
      const userDetails = await UserModel.findById(user, { _id: 1, email: 1, userName: 1 });

      // add user details message
      _message._doc.user = userDetails;

      // socket emit for new message
      socket.to(conversationId).emit('new_message', _message);

      // socket emit for sent new message
      socket.emit('sent_new_message', user);

      // socket emit for update message on friend conversation list
      conversation._doc.participants.forEach((item) => {
        if (item !== user) {
          conversation._doc.friendDetails = userDetails;

          conversation._doc.lastMessage = _message._doc;

          const conversationData = { ...conversation._doc };
          delete conversationData.messageCounters;

          ConversationSocket.emit(`${item}_update_conversation`, conversationData);
        }
      });

      // update the last message in conversation
      conversation.lastMessage = _message._doc._id;

      // update new message counters in conversation
      conversation.messageCounters = conversation.messageCounters.map((item) => {
        // counter will be zero for the sender
        if (item.user === user) {
          return { user: item.user, counter: 0, lastMessage: _message._doc._id };
        }

        return { user: item.user, counter: item.counter + 1, lastMessage: _message._doc._id };
      });

      // update conversation details in database
      await conversation.save();
    } catch (e) {}
  });

  /**
   * when someone seen the messages on the chat screen
   */
  socket.on('seen_conversation_messages', async (data) => {
    try {
      const { conversationId, user } = data;

      // find all message ids which not seen by user
      const messages = await MessageModel.find({ conversationId, seenBy: { $ne: user } }, { _id: 1 });

      // checking whether seen already or not
      if (messages.length) {
        // if not seen by user so update in database
        await MessageModel.updateMany({ conversationId, seenBy: { $ne: user } }, { $push: { seenBy: user } });

        // socket emit to tell the friend that messages has been seen
        socket.to(conversationId).emit('seen_all_messages', user);
      }

      // socket emit to user for removing new message counter
      ConversationSocket.emit(`${user}_seen_conversation_messages`, conversationId);

      // update new message counters in conversation
      const conversation = await ConversationModel.findById(conversationId);

      if (conversation) {
        conversation.messageCounters = conversation.messageCounters.map((item) => {
          // counter will be zero for seen user
          if (item.user === user) {
            return { user: item.user, counter: 0, lastMessage: item.lastMessage };
          }
          return { user: item.user, counter: item.counter, lastMessage: item.lastMessage };
        });

        await conversation.save();
      }
    } catch (e) {}
  });
});
