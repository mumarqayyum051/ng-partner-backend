const SocketIO = require('./config');

module.exports = SocketIO.of('/conversations').on('connection', () => {});
