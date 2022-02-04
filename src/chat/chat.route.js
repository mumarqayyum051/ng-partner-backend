const express = require('express');

const { requireAuth } = require('../config/passport.config');

const router = express.Router();

router.use(requireAuth);

module.exports = router;
