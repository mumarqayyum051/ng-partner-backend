const express = require("express");

const { requireUserLogin, requireAuth } = require("../config/passport.config");
const { getUsers } = require("./user.controller");
const { getUser } = require("./user.controller");
const { updateUser } = require("./user.controller");

const router = express.Router();

router.use(requireAuth);

router.route("/").get(getUsers);

router.route("/:id").get(getUser);

router.route("/:id").patch(updateUser);

module.exports = router;
