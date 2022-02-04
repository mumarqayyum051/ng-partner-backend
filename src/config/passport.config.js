const passport = require('passport');
const JwtStrategy = require('passport-jwt').Strategy;
const { ExtractJwt } = require('passport-jwt');
const LocalStrategy = require('passport-local');

const { UserModel } = require('../models');

// create local strategy for main user login
passport.use('user-local', new LocalStrategy({ usernameField: 'email', passReqToCallback: true }, ((req, email, password, done) => {
  UserModel.findOne({ $or: [{ email }] }, (error, user) => {
    if (error) { return done(error); }

    if (!user) {
      return done(null, false);
    }

    if (user && user.deleted) {
      return done(null, false);
    }

    user.comparePassword(password, async (err, isMatch) => {
      if (err) {
        return done(err);
      }

      if (!isMatch) {
        return done(null, false);
      }

      return done(null, user);
    });
    return null;
  });
})));

// Setup Options for Jwt strategy
const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: '879sdaf9sdnf8n809assd9f8s90adsdjg',
};

// create jwt strategy for user authentication
passport.use('jwt', new JwtStrategy(jwtOptions, ((payload, done) => {
  UserModel.findById(payload.sub, (err, user) => {
    if (err) {
      return done(err, false);
    }

    if (!user) {
      return done(null, false);
    }

    return done(null, user);
  });
})));

exports.requireAuth = passport.authenticate('jwt', { session: false });
exports.requireUserLogin = passport.authenticate('user-local', { session: false });
