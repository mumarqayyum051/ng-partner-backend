const jwt = require('jsonwebtoken');
module.exports = function verifyToken(token) {
    try{
        const res= jwt.verify(token, '879sdaf9sdnf8n809assd9f8s90adsdjg');
        return res;
    }
    catch(e){
        return e;
    }
  };