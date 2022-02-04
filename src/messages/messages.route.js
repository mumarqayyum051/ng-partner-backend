const express = require('express');

const { requireAuth } = require('../config/passport.config');

const { getMessages } = require('./messages.controller');

const router = express.Router();

router.use(requireAuth);

router.get('/', getMessages);

module.exports = router;
