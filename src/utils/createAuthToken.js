const jwt = require('jsonwebtoken');
const { JWT_SECRET_KEY } = require('../config/secrets.config');

module.exports = function createAuthToken(userId) {
  const timeStamp = new Date().getTime();
  return jwt.sign({ sub: userId, iat: timeStamp }, '879sdaf9sdnf8n809assd9f8s90adsdjg');
};


