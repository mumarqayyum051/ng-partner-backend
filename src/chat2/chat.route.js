const router = require('express').Router();

const ChatGroupModel = require('../models/ChatGroup');
const ChatModel = require('../models/Chat');

const {
  addChatGroup,
  visitFriend,
  addChatMessage,
  getAllChatGroups,
  getAllMessages,
  markAllRead,
  getMessageUnseen,
} = require('./chat2Controller');
const httpResponse = require('express-http-response');

//add friends
router.route('/addChatGroup/:receiverID/:senderID').post(addChatGroup);

//enable visible
router.route('/visit/:chatGroupID').put(visitFriend);

//add a chat //send message
router.route('/addChat/:chatGroupID/:senderID').post(addChatMessage);

//get all conversations
router.route('/chatGroups/:userID').get(getAllChatGroups);

//get all messages
router.route('/chatMessages/:chatGroupID').get(getAllMessages);

//get Unread Count messages
// router.route('/chatMessages/unreadCount/:chatGroupID').get(getUnreadCount);

// Markt all read
router.route('/chatMessages/markRead/:chatGroupID/:userID').put(markAllRead);

//get unread message
router.route('/chatMessages/getUnseen/:chatGroupID/:userID').get(getMessageUnseen);

// router.route('/add/:receiverID/:senderID').post(returnOrCreateChatGroup);

router.use(httpResponse.Middleware);

module.exports = router;
