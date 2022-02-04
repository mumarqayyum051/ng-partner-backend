const { FriendsModel, UserModel } = require('../models');
const { queryBuilder, modifyReqUser } = require('../utils');
const FriendRequestSocket = require('../webSockets/friendsRequest');
const mongoose = require('mongoose');

/* =============================================================================
  GET /friends
============================================================================= */
exports.getFriends = async (req, res, next) => {
  try {
    const { search, cursor } = req.query;

    const { user } = req;

    let userIds = [];

    const query = {
      user: user._id,
      status: { $in: ['accepted', 'pending'] },
    };

    if (search) {
      const users = await UserModel.find(
        {
          $or: [{ email: { $regex: search, $options: 'i' } }, { userName: { $regex: search, $options: 'i' } }],
        },
        { _id: 1 }
      );

      if (users) {
        userIds = users.map((item) => item._id);
      }

      query.friend = { $in: userIds };
    }

    // Get friends
    const friends = await FriendsModel.find(queryBuilder(query, cursor, true))
      .sort({ _id: -1 })
      .populate(
        'friend',
        '_id email designation firstName skills partneurStatus image industryInterest hobbies lastName bio'
      );

    // Get last user by id for next cursor value
    const lastCursor = friends.length ? friends[friends.length - 1]._id : null;

    // Do we have more results?
    const hasMore = lastCursor
      ? Boolean(
          await FriendsModel.findOne({
            ...query,
            _id: { $lt: lastCursor },
            status: { $in: ['accepted', 'pending'] },
            $or: [{ friend: user._id }, { user: user._id }],
          })
        )
      : false;

    // Sanitize friends
    const data = friends.map((item) => ({
      _id: item._id,
      user: item.user,
      status: item.status,
      friend: item.friend,
      requestBy: item.requestBy,
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

exports.getFriend = async (req, res, next) => {
  try {
    if (req.params.id === '' || req.params.id === undefined) {
      res.status(422).json({
        status: 400,
        name: 'Bad request',
        message: 'Friend id is required',
      });
      return;
    } else {
      const friend = await FriendsModel.findById(req.params.id);

      if (!friend) {
        //if friend not found the return error
        res.status(404).json({
          code: 404,
          error: 'NOT_FOUND',
          message: 'friend not found',
        });
      } else {
        // friend found, return friend object
        const modifiedUser = modifyReqUser(friend);
        res.status(200).json(modifiedUser);
      }
    }
  } catch (e) {
    next(e);
  }
};
/* =============================================================================
  POST /send_friend_request
============================================================================= */
exports.sendFriendRequest = async (req, res, next) => {
  try {
    const { user } = req;
    const { friendId } = req.body;

    const alreadySent = await FriendsModel.findOne({ friend: req.body.friendId, user: user._id }, { _id: 1 });

    // Error - User send request to himself
    if (user && friendId === user._id.toString()) {
      res.status(422).json({
        status: 400,
        name: 'Bad request',
        message: 'You can not send request to this friend',
      });
      return;
    }

    // Error - Already request send
    if (alreadySent) {
      res.status(422).json({
        status: 400,
        name: 'Bad request',
        message: 'You already have sent the request to this friend',
      });
      return;
    }

    const _friend = await FriendsModel.create({
      friend: friendId,
      user: user._id,
      requestBy: user._id,
    });

    // creating new document for the friend
    const _forFriend = await FriendsModel.create({
      friend: user,
      user: friendId,
      requestBy: user._id,
    });

    const friendDetails = await UserModel.findById(_friend._doc.friend);

    const returnData = {
      _id: _friend._doc._id,
      user: _friend._doc.user,
      status: _friend._doc.status,
      requestBy: _friend._doc.requestBy,
      friend: modifyReqUser(friendDetails),
    };
    const notificationData = { ...returnData }; //this is for user, who receive friend request
    notificationData._id = _forFriend._doc._id;
    notificationData.user = friendId;
    notificationData.friend = modifyReqUser(user);
    FriendRequestSocket.to(friendId).emit('requestReceive', notificationData);

    res.status(200).json(returnData);
  } catch (e) {
    next(e);
  }
};

/* =============================================================================
  PUT /change_request_status
============================================================================= */
exports.changeRequestStatus = async (req, res, next) => {
  try {
    const { id, status } = req.body;

    // Get friend
    const friend = await FriendsModel.findById(id);

    // Get friend document
    const friendDocument = await FriendsModel.findOne({
      friend: friend.user,
      user: friend.friend,
    });

    // Error - Document not found
    if (!friend) {
      res.status(422).json({
        status: 400,
        name: 'Bad request',
        message: 'Invalid document id',
      });
      return;
    }

    friend.status = status;
    friendDocument.status = status;

    // Save user
    await friend.save();
    await friendDocument.save();
    const requestById = friendDocument.requestBy._id.toString();
    FriendRequestSocket.to(requestById).emit('requestStatusUpdated', { id: friendDocument._id, status });

    res.status(200).json({ id, status });
  } catch (e) {
    next(e);
  }
};
