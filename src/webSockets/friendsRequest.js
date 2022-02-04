const SocketIO = require("./config");

module.exports = SocketIO.of("/friendsRequest").on("connection", (socket) => {
  const userId=socket.handshake.query.userId;
  socket.join(userId);
});
