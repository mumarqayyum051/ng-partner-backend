const { UserModel } = require('../models');
const { queryBuilder, modifyReqUser } = require('../utils');
const bcrypt = require("bcryptjs");

/* =============================================================================
  GET /users
============================================================================= */
exports.getUsers = async (req, res, next) => {
  try {
    const { search, cursor } = req.query;

    const query = {};

    if (search && search !== 'null') {
      query.$or = [{ email: { $regex: search, $options: 'i' } }, { userName: { $regex: search, $options: 'i' } }];
    }

    // Get users
    const users = await UserModel.find(queryBuilder(query, cursor, true)).sort({ _id: -1 });

    // Get last user by id for next cursor value
    const lastCursor = users.length ? users[users.length - 1]._id : null;

    // Do we have more results?
    const hasMore = lastCursor ? Boolean(await UserModel.findOne({ ...query, _id: { $lt: lastCursor } })) : false;

    // Sanitize users
    const data = users.map((user) => modifyReqUser(user));

    res.status(200).json({
      data,
      cursor: lastCursor,
      hasMore,
    });
  } catch (e) {
    next(e);
  }
};

/* =============================================================================
  GET /user
============================================================================= */
exports.getUser = async (req, res, next) => {
  try {
    if (req.params.id === 'me') {
      // check if id is me then return login user object
      const modifiedUser = modifyReqUser(req.user);
      res.status(200).json(modifiedUser);
    } else {
      const user = await UserModel.findById(req.params.id);

      if (!user) {
        //if user not found the return error
        res.status(404).json({
          code: 404,
          error: 'NOT_FOUND',
          message: 'user not found',
        });
      } else {
        // user found, return user object
        const modifiedUser = modifyReqUser(user);
        res.status(200).json(modifiedUser);
      }
    }
  } catch (e) {
    next(e);
  }
};

/* =============================================================================
  PATCH /user
============================================================================= */
exports.updateUser = async (req, res, next) => {
  try {
    let body = { ...req.body };
    console.log(body);
    delete body.email; //user can not edit his email in update user
    if (body.newPassword !== "") {
      let { newPassword } = body;

      console.log("newpassword", newPassword);
      const salt = await bcrypt.genSalt(10);
      const hashed = await bcrypt.hash(newPassword, salt);
      body.password = hashed;
      delete body.newPassword;
      delete body.confirmNewPassword;
    }
    const userUpdated = await UserModel.findByIdAndUpdate(req.params.id, body, {
      returnOriginal: false,
    });
    console.log(userUpdated);

    if (!userUpdated) {
      //if user not found the return error
      res.status(404).json({
        code: 404,
        error: "NOT_FOUND",
        message: "user not found",
      });
    } else {
      // user found, return user object
      const modifiedUser = modifyReqUser(userUpdated);
      res.status(200).json(modifiedUser);
    }
  } catch (e) {
    next(e);
  }
};

