const ChatGroupModel = require('../models/ChatGroup');
const ChatModel = require('../models/Chat');
const UnreadCountModel = require('../models/UnreadCount');
const { OkResponse, BadRequestResponse, ForbiddenResponse } = require('express-http-response');
const UserModel = require('../models/User.model');
const UnreadCount = require('../models/UnreadCount');

const addChatGroup = async (req, res, next) => {
  await UserModel.findOne({ _id: req.params.senderID }, (err, user) => {
    if (!err && user !== null) {
      req.sender = user;
      //
    } else {
      return next(new BadRequestResponse('User not found!', 423));
    }
  });

  await UserModel.findOne({ _id: req.params.receiverID }, (err, user) => {
    if (!err && user !== null) {
      req.receiver = user;
      //
    } else {
      return next(new BadRequestResponse('User not found!', 423));
    }
  });
  let query = {
    $or: [
      {
        user1: req.params.senderID,
        user2: req.params.receiverID,
      },
      {
        user2: req.params.senderID,
        user1: req.params.receiverID,
      },
    ],
  };
  //
  ChatGroupModel.find(query)
    .then((match) => {
      //
      //
      if (match.length !== 0) {
        //
        return next(
          new OkResponse({
            message: 'Already chatGroup',
            chatGroup: match[0]._id,
          })
        );
      } else {
        new ChatGroupModel({
          user1: req.sender._id,
          user2: req.receiver._id,
        })
          .save()
          .then((chatGroup) => {
            //
            // res.status(200).send(chatGroup);
            return next(new OkResponse(chatGroup));
          })
          .catch((err) => {
            return next(new BadRequestResponse(err));
          });
      }
    })
    .catch((err) => {
      return next(new BadRequestResponse(err));
    });
};

const visitFriend = async (req, res, next) => {
  //
  ChatGroupModel.findOne({
    _id: req.params.chatGroupID,
  })
    .then((chatGroup) => {
      if (!chatGroup) {
        return next(new BadRequestResponse('No chatGroup Found'));
      }
      req.chatGroup = chatGroup;
      if (req.chatGroup.isVisited === true) {
        //
        return next(new ForbiddenResponse('chatGroup Already Visited'));
      }

      req.chatGroup.isVisited = true;

      req.chatGroup.save((err, result) => {
        if (err) {
          //
          return next(new BadRequestResponse(err));
        } else {
          //
          return next(new OkResponse(result));
        }
      });
    })
    .catch((err) => {
      //
      return next(new BadRequestResponse(err));
    });
};

const addChatMessage = async (req, res, next) => {
  const userID = req.params.userID;

  await UserModel.findOne({ _id: req.params.senderID }, (err, user) => {
    if (err && !user !== null) {
      return next(new BadRequestResponse('User not found!', 423));
    }
    req.sender = user;
  });

  ChatGroupModel.findOne({
    _id: req.params.chatGroupID,
  })
    .then((chatGroup) => {
      if (!chatGroup) {
        return next(new BadRequestResponse('No chatGroup Found'));
      }
      req.chatGroup = chatGroup;

      if (req.body.text === undefined || req.body.text.trim().length === 0) {
        //
        return next(new BadRequestResponse('Missing required parameter', 422));
      }

      // save the text and send Event
      let chat = new ChatModel();

      chat.chatGroupID = req.chatGroup._id;
      chat.sender = req.sender._id;
      chat.text = req.body.text;

      if (req.sender._id.toString() === req.chatGroup.user1._id.toString()) {
        chat.receiver = req.chatGroup.user2._id;
      } else {
        chat.receiver = req.chatGroup.user1._id;
      }

      if (req.body.replyTo) {
        chat.reply = req.body.replyTo;
      }

      //
      //

      chat.save(function (err, result) {
        if (err) {
          return next(new BadRequestResponse('Server Error'));
        } else {
          if (req.params.senderID.toString() === req.chatGroup.user1._id.toString()) {
            req.chatGroup.user1Unread = 0;
            req.chatGroup.user2Unread = +req.chatGroup.user2Unread + 1;
          } else {
            req.chatGroup.user2Unread = 0;
            req.chatGroup.user1Unread = +req.chatGroup.user1Unread + 1;
          }

          req.chatGroup.chatMessages.push(chat._id);
          req.chatGroup.lastMessage = chat._id;
          // req.chatGroup.unReadCount = +req.chatGroup.unReadCount + 1;
          req.chatGroup
            .save()
            .then(() => {
              // allSportsSocket.emit("conversation" + chat.receiver);
              // next(new OkResponse({ proposal: proposal }));
            })
            .catch((err) => next(new BadRequestResponse(err)));
          //
          next(new OkResponse(result));
        }
      });
    })
    .catch((err) => {
      //
      return next(new BadRequestResponse(err));
    });
  //
};

const getAllChatGroups = async (req, res, next) => {
  const userID = req.params.userID;
  const options = {
    page: +req.query.page || 1,
    limit: +req.query.limit || 10,
    populate: [
      {
        path: 'user1',
        model: 'users',
        // select: "username",
      },
      {
        path: 'user2',
        model: 'users',
        // select: "username",
      },
      {
        path: 'lastMessage',
        model: 'Chat',
        // select: "receiver sender message createdAt",
      },
    ],
    sort: {
      updatedAt: -1,
    },
  };
  let query = {
    $or: [{ user1: userID }, { user2: userID }],
  };
  query.isVisited = true;
  query.status = 1;
  //

  ChatGroupModel.paginate(query, options, (err, result) => {
    if (err) {
      //
      return next(new BadRequestResponse('Server Error'));
    } else {
      //
      ChatModel.count({ chatGroup: result._id, isRead: false, receiver: req.params.userID }, (err, count) => {
        if (err) next(new BadRequestResponse(err));
        req.count = count;
      });
      return next(new OkResponse({ result: result.docs, count: req.count }));
    }
  });
};

const getAllMessages = async (req, res, next) => {
  const chatGroupID = req.params.chatGroupID;
  //
  ChatGroupModel.findOne({
    _id: chatGroupID,
  })
    .then((chatGroup) => {
      //
      if (!chatGroup) {
        return next(new BadRequestResponse('No chatGroup Found'));
      }
      req.chatGroup = chatGroup;
      //
      //
      //
      const options = {
        page: +req.query.page || 1,
        limit: +req.query.limit || 20,
        sort: {
          createdAt: -1,
        },
      };

      let query = {};
      query.chatGroupID = req.chatGroup._id;

      ChatModel.paginate(query, options, (err, history) => {
        if (err) {
          //
          //
          next(new BadRequestResponse(err));
        } else {
          //
          next(
            new OkResponse({
              Chat: history,
              user: {
                _id: req.chatGroup._id,
                lastMessage: req.chatGroup.lastMessage,
                createdAt: req.chatGroup.createdAt,
                updatedAt: req.chatGroup.updatedAt,
                // Receiver: req.friend.user1.email === req.sender.email ? req.friend.user2.email : req.friend.user1.email,
              },
            })
          );
        }
      }).catch((error) => {
        //
        next(new BadRequestResponse(error));
      });
    })
    .catch((err) => {
      //
      return next(new BadRequestResponse(err));
    });
};

const markAllRead = async (req, res, next) => {
  const chatGroupID = req.params.chatGroupID;
  const userID = req.params.userID;
  ChatGroupModel.findOne({ _id: chatGroupID })
    .then((chatGroup) => {
      if (!chatGroup) return next(new BadRequestResponse('No chatGroup Found'));
      req.chatGroup = chatGroup;

      ChatModel.find({ chatGroupID: req.chatGroup._id, isRead: false, receiver: userID })
        .then((chats) => {
          if (!chats) {
            return next(new BadRequestResponse('No chats Found'));
          }
          chats.forEach((e) => {
            e.isRead = true;
            e.save((err, result) => {
              if (err) return next(new BadRequestResponse(err));
            });
          });
          console.log(req.chatGroup.user1._id);
          console.log(req.params.userID);
          console.log(req.chatGroup.user2.user1Unread);
          console.log(req.chatGroup.user1Unread);
          if (req.chatGroup.user1._id.toString() === req.params.userID.toString()) {
            req.chatGroup.user1Unread = 0;
          } else {
            req.chatGroup.user2Unread = 0;
          }
          // req.chatGroup.unReadCount = +req.chatGroup.unReadCount - chats.length;

          req.chatGroup.save((err, result) => {
            if (err) return next(new BadRequestResponse(err));
            return next(new OkResponse('done'));
          });
        })
        .catch((err) => next(new BadRequestResponse(err)));
    })
    .catch((err) => next(new BadRequestResponse(err)));
};

const getMessageUnseen = async (req, res, next) => {
  // ChatGroupModel.findOne({ _id:  }).then((chatGroup) => {
  //   if (!chatGroup) return next(new BadRequestResponse('No chatGroup Found'));
  //   req.chatGroup = chatGroup;
  //

  const options = {
    page: +req.query.page || 1,
    limit: +req.query.limit || 20,
    sort: { createdAt: -1 },
  };

  let query = {
    chatGroupID: req.params.chatGroupID,
    isRead: false,
  };

  //
  ChatModel.paginate(query, options, (err, history) => {
    if (err) {
      //
      return next(new BadRequestResponse(err));
    }

    return next(
      new OkResponse({
        Chats: history.docs,
      })
    );
  }).catch((error) => {
    next(new BadRequestResponse(error));
  });
  // });
};

module.exports = {
  addChatGroup,
  visitFriend,
  addChatMessage,
  getAllChatGroups,
  getAllMessages,
  markAllRead,
  getMessageUnseen,
};
