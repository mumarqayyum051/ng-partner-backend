const Joi = require('@hapi/joi');

const { ConversationModel, MessageModel, UserModel } = require('../models');
const { queryBuilder } = require('../utils');

/* =============================================================================
  GET /conversations
============================================================================= */
exports.getConversations = async (req, res, next) => {
  try {
    const validationSchema = Joi.object({ cursor: Joi.string(), limit: Joi.number() });

    await validationSchema.validateAsync(req.query);

    const { user } = req;

    const { cursor, limit = 10 } = req.query;

    const { _id: userId } = user;

    const query = {
      participants: userId,
      messageCounters: { $elemMatch: { user: userId.toString(), lastMessage: { $ne: null } } },
    };

    // Get conversations
    const conversations = await ConversationModel.find(queryBuilder(query, cursor, true))
      .sort({ _id: -1 })
      .limit(+limit)
      .populate('participants', '_id email firstName lastName');

    // Get last user by id for next cursor value
    const lastCursor = conversations.length ? conversations[conversations.length - 1]._id : null;

    // Do we have more results?
    const hasMore = lastCursor
      ? Boolean(
          await ConversationModel.findOne({
            ...query,
            _id: { $lt: lastCursor },
          })
        )
      : false;

    const results = await Promise.all(
      conversations.map(async ({ _doc }) => {
        const docWithDetails = { ..._doc };

        //  get friend details
        const friendDetails = docWithDetails.participants.find((item) => item._id.toString() !== userId.toString());
        docWithDetails.friendDetails = friendDetails;

        // get the last message of the user
        const lastMessage = await MessageModel.find({ conversationId: _doc._id }, { createdAt: 1, text: 1, image: 1 })
          .sort({ createdAt: -1 })
          .limit(1);
        docWithDetails.lastMessage = lastMessage.length ? lastMessage[0] : null;

        // getting new message counter
        const userCounter = docWithDetails.messageCounters.find((item) => item.user.toString() === userId.toString());
        docWithDetails.newMessageCounter = userCounter ? userCounter.counter : 0;
        delete docWithDetails.messageCounters;

        return docWithDetails;
      })
    );

    // Sanitize friends
    const data = results.map((item) => ({
      _id: item._id,
      lastMessage: item.lastMessage,
      friendDetails: item.friendDetails,
      newMessageCounter: item.newMessageCounter,
    }));

    res.status(200).json({
      data,
      hasMore,
      cursor: lastCursor,
    });
  } catch (e) {
    next(e);
  }
};

/* =============================================================================
  GET /conversations/details
============================================================================= */
exports.getConversationDetails = async (req, res, next) => {
  try {
    const participants = JSON.parse(req.query.participants);

    if (!participants || participants.length !== 2) {
      res.status(403).json({ message: 'Please provide valid participants details' });
      return;
    }

    const conversation = await ConversationModel.findOne({ participants: { $size: 2, $all: participants } });

    // if conversation found so return conversation details
    if (conversation) {
      const friendId = conversation.participants.find((item) => item !== req.user._id);
      const friendDetails = await UserModel.findById(friendId, {
        _id: 1,
        email: 1,
        userName: 1,
      });
      conversation._doc.friendDetails = friendDetails;

      // get the last message of the user
      const lastMessage = await MessageModel.find(
        { conversationId: conversation._doc._id },
        { createdAt: 1, text: 1, image: 1 }
      )
        .sort({ createdAt: -1 })
        .limit(1);

      conversation._doc.lastMessage = lastMessage.length ? lastMessage[0] : null;

      res.status(200).json(conversation);
      return;
    }

    // if conversation is not found so create new one and return new conversation details
    const newConversation = {
      participants,
      messageCounters: participants.map((item) => ({ user: item, counter: 0, lastMessage: null })),
    };
    const _conversation = await ConversationModel.create(newConversation);

    const friendId = _conversation._doc.participants.find((item) => item !== req.user._id);
    const friendDetails = await UserModel.findById(friendId, {
      _id: 1,
      email: 1,
      userName: 1,
    });
    _conversation._doc.friendDetails = friendDetails;

    res.status(200).json(_conversation);
  } catch (e) {
    next(e);
  }
};

/* =============================================================================
  DELETE /conversations/:conversationId
============================================================================= */
exports.deleteConversation = async (req, res, next) => {
  try {
    const validationSchema = Joi.object({ conversationId: Joi.string().required() });

    await validationSchema.validateAsync(req.params);

    const {
      params: { conversationId },
      user,
    } = req;

    await MessageModel.updateMany({ conversationId }, { $push: { deleteUsers: user._id } });

    res.status(200).json({ conversationId });

    // updating conversation messageCounters
    const conversation = await ConversationModel.findById(conversationId);
    conversation.messageCounters = conversation.messageCounters.map((item) => {
      // counter will be zero for seen user
      if (item.user.toString() === user._id.toString()) {
        return { user: item.user, counter: 0, lastMessage: null };
      }
      return { user: item.user, counter: item.counter, lastMessage: item.lastMessage };
    });

    await conversation.save();
  } catch (e) {
    next(e);
  }
};
