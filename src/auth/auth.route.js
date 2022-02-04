const express = require("express");
const authController = require("./auth.controller");
const { requireUserLogin, requireAuth } = require("../config/passport.config");

const router = express.Router();

router.post("/register", authController.register);

router.post("/login", requireUserLogin, authController.login);

router.get("/verify_auth_token", requireAuth, authController.verifyAuthToken);

router.post("/forgot_password", authController.forgotPassword);

router.post("/reset_password", authController.resetPassword);

module.exports = router;
