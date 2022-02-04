const Joi = require("joi");
const { UserModel } = require("../models");
const {
  createAuthToken,
  modifyReqUser,
  verifyToken,
  createResetToken,
} = require("../utils");
const { sendEmail } = require("../email/email");
const bcrypt = require("bcryptjs");
/* =============================================================================
  GET /auth/verify_auth_token
============================================================================= */
exports.verifyAuthToken = async (req, res) => {
  const user = modifyReqUser(req.user);
  res.status(200).json(user);
};

/* =============================================================================
  POST /auth/login
============================================================================= */
exports.login = async (req, res) => {
  res.status(200).json({
    user: modifyReqUser(req.user),
    token: createAuthToken(req.user._id),
  });
};

/* =============================================================================
  POST /auth/register
============================================================================= */
exports.register = async (req, res, next) => {
  try {
    const validationSchema = Joi.object({
      userName: Joi.string().min(5).default(""),
      firstName: Joi.string().min(2).required(),
      lastName: Joi.string().min(2).required(),
      affiliateCode: Joi.string().min(2).optional().default(""),
      password: Joi.string().min(6).max(30).required(),
      email: Joi.string().email({ minDomainSegments: 2 }).required(),
      confirmPassword: Joi.string()
        .min(6)
        .max(30)
        .required()
        .valid(Joi.ref("password"))
        .required(),
    }).with("password", "confirmPassword");

    await validationSchema.validateAsync(req.body);

    const existingUserWithEmail = await UserModel.findOne(
      { email: req.body.email },
      { _id: 1 }
    );

    // Error - User already exist with given email
    if (existingUserWithEmail) {
      res.status(422).json({
        status: 400,
        name: "Bad request",
        message: "User with the given email is already exist.",
      });
      return;
    }

    const { userName, email, password, firstName, lastName, affiliateCode } =
      req.body;

    const _user = await UserModel.create({
      email,
      userName,
      password,
      firstName,
      lastName,
      affiliateCode,
    });
    const emailData = {
      user: _user,
      linkAddress: `${req.headers.referer}connect/`,
      serverUrl: `${req.headers.referer}`,
    };

    sendEmail(_user.email, emailData, "Welcome to Partneur", "welcome");

    res.status(200).json({
      user: modifyReqUser(_user),
      token: createAuthToken(_user._doc._id),
    });
  } catch (e) {
    next(e);
  }
};

/* =============================================================================
  POST /auth/forgot_password
============================================================================= */
exports.forgotPassword = async (req, res, next) => {
  console.log(req.body.email)
  console.log(req.body)
  try {
    const validationSchema = Joi.object({
      email: Joi.string().email({ minDomainSegments: 2 }).required(),
    });
    await validationSchema.validateAsync(req.body);
    const existingUserWithEmail = await UserModel.findOne(
      { email: req.body.email },
      { _id: 1, firstName: 1, lastName: 1, email: 1 }
    );

    // Error - User does't exist with given email
    if (!existingUserWithEmail) {
      res.status(422).json({
        status: 400,
        name: "Bad request",
        message: "User with the given email does't exist.",
      });
      return;
    } else {
      const token = createResetToken(existingUserWithEmail._id);
      const emailData = {
        user: existingUserWithEmail._doc,
        linkAddress: `${req.headers.referer}dashboard/`,
        serverUrl: `${req.headers.referer}`,
        resetUrl: `${req.headers.referer}auth/resetpassword?token=${token}`,
      };
      console.log(emailData)
      console.log(emailData, existingUserWithEmail._doc.email);
      sendEmail(
        existingUserWithEmail._doc.email,
        emailData,
        "Reset Password",
        "passwordReset"
      );
      res.status(200).json({
        message: "Token sent",
        result: true,
      });
    }
  } catch (e) {
    next(e);
  }
};

/* =============================================================================
  POST /auth/reset_password
============================================================================= */
exports.resetPassword = async (req, res, next) => {
  try {
    const validationSchema = Joi.object({
      token: Joi.string().required(),
      password: Joi.string().min(6).max(30).required(),
      confirmPassword: Joi.string()
        .min(6)
        .max(30)
        .required()
        .valid(Joi.ref("password"))
        .required(),
    }).with("password", "confirmPassword");
    await validationSchema.validateAsync(req.body);
    const { body = {} } = req;
    const { token = "", password } = body;
    const tokenRes = verifyToken(token);
    if (tokenRes.sub) {
      const salt = await bcrypt.genSalt(10);
      const hashed = await bcrypt.hash(password, salt);
      const userUpdated = await UserModel.findByIdAndUpdate(
        tokenRes.sub,
        { password: hashed },
        {
          returnOriginal: false,
        }
      );
      if (!userUpdated.err) {
        const emailData = {
          user: userUpdated._doc,
          linkAddress: `${req.headers.referer}dashboard/`,
          serverUrl: `${req.headers.referer}`,
        };
        sendEmail(
          userUpdated._doc.email,
          emailData,
          "Password Change Confirmation",
          "passwordChangeConfirmation"
        );
        res.status(200).json({
          message: "Password reseted",
          result: true,
        });
      } else {
        res.status(401).json({
          message: "Link expired",
        });
      }
    } else {
      res.status(401).json({
        message: "Link expired",
      });
    }
  } catch (e) {
    next(e);
  }
};
