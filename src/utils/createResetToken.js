const jwt = require("jsonwebtoken");
module.exports = function createResetToken(userId) {
  return jwt.sign({ sub: userId }, "879sdaf9sdnf8n809assd9f8s90adsdjg", {
    expiresIn: 60 * 2,
  });
};
