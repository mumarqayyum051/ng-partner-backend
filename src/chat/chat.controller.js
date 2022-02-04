let router = require('express').Router();
let { OkResponse, BadRequestResponse, UnauthorizedResponse } = require('express-http-response');
let mongoose = require('mongoose');
const { requireAuth } = require('../config/passport.config');

let Chat = mongoose.model('Chat');
let User = mongoose.model('User');
let Friend = mongoose.model('Friend');
router.use(requireAuth);

module.exports = router;
