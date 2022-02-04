const express = require('express');

const { requireAuth } = require('../config/passport.config');

const {
  getConversations,
  deleteConversation,
  getConversationDetails,
} = require('./conversations.controller');

const router = express.Router();

router.use(requireAuth);

router.get('/', getConversations);

router.get('/details', getConversationDetails);

router.delete('/:conversationId', deleteConversation);

module.exports = router;
