const express = require('express');

const { requireAuth } = require('../config/passport.config');
const { getFriends, sendFriendRequest, changeRequestStatus, getFriend } = require('./friends.controller');

const router = express.Router();

router.use(requireAuth);

router.route('/').get(getFriends);

router.route('/:id').get(getFriend);

router.route('/send_friend_request').post(sendFriendRequest);

router.route('/change_request_status').put(changeRequestStatus);

module.exports = router;
