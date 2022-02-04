const Joi = require('@hapi/joi');

const { MessageModel } = require('../models');
const queryBuilder = require('../utils/queryBuilder');

/* =============================================================================
  GET /messages
============================================================================= */
exports.getMessages = async (req, res, next) => {
  try {
    const validationSchema = Joi.object({
      limit: Joi.number(),
      cursor: Joi.string(),
      conversationId: Joi.string().required(),
    });

    await validationSchema.validateAsync(req.query);

    const { conversationId, cursor, limit = 10,  } = req.query;

    const query = { conversationId, deleteUsers: { $ne: req.user._id } };

    // Get messages
    const messages = await MessageModel
      .find(queryBuilder(query, cursor, true))
      .sort({ _id: -1 })
      .limit(+limit)
      .populate('user', '_id email firstName lastName');

    // Get last user by id for next cursor value
    const lastCursor = messages.length ? messages[messages.length - 1]._id : null;

    // Do we have more results?
    const hasMore = lastCursor
      ? Boolean(await MessageModel.findOne({
        ...query,
        _id: { $lt: lastCursor },
      }))
      : false;

    // Sanitize friends
    const data = messages
      .map((item) => ({
        _id: item._id,
        firstName: item.firsName,
        lastName: item.lastName,
        text: item.text,
        image: item.image,
        seenBy: item.seenBy,
        user: item.user,
        conversationId: item.conversationId,
      }));

    return res.status(200).json({
      data,
      hasMore,
      cursor: lastCursor,
    });
  } catch (e) {
    next(e);
  }
};
