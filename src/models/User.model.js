/* eslint-disable consistent-return */
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

const { emailValidator, passwordValidator } = require('../utils');

const { Schema } = mongoose;

/* =============================================================================
 User Schema
============================================================================= */
const UserSchema = new Schema(
  {
    userName: {
      type: String,
      default: '',
    },
    email: {
      type: String,
      unique: true,
      lowercase: true,
      validate: [emailValidator, 'Please provide a valid email address'],
      required: [true, 'Email is required'],
    },
    password: {
      type: String,
      validate: [passwordValidator, 'Password must be at lest 6 digits'],
      required: [true, 'Password is required'],
    },
    firstName: {
      type: String,
      required: [true, 'firstName is required'],
      default: '',
    },
    lastName: {
      type: String,
      required: [true, 'lastName is required'],
      default: '',
    },
    affiliateCode: {
      type: String,
      default: '',
    },
    designation: {
      type: String,
      default: '',
    },
    bio: {
      type: String,
      default: '',
    },
    partneurStatus: {
      type: [
        {
          type: String,
        },
      ],
      default: [],
    },
    industryInterest: {
      type: [
        {
          type: String,
        },
      ],
      default: [],
    },
    hobbies: {
      type: [
        {
          type: String,
        },
      ],
      default: [],
    },
    skills: {
      type: [
        {
          type: String,
        },
      ],
      default: [],
    },
    image: {
      type: String,
      default: 'assets/svg/defaultLogo.svg',
    },
  },
  { timestamps: true }
);

/**
 * save password with encrypt
 */
UserSchema.pre('save', function (next) {
  const user = this;
  if (!user.isModified('password')) {
    return next();
  }
  bcrypt.genSalt(10, (err, salt) => {
    if (err) {
      return next(err);
    }
    bcrypt.hash(user.password, salt, (error, hash) => {
      if (error) {
        return next(error);
      }
      user.password = hash;
      return next();
    });
  });
});

/**
 * compare password with encrypted password
 */
UserSchema.methods.comparePassword = function (candidatePassword, cb) {
  bcrypt.compare(candidatePassword, this.password, (err, isMatch) => {
    cb(err, isMatch);
  });
};

/* =============================================================================
 User Modal
============================================================================= */
const User = mongoose.model('users', UserSchema);
module.exports = User;
