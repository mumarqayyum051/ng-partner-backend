const SocketIO = require('socket.io')(
    {
        cors: {
            origin: [
                "http://localhost:4200",
                "http://134.122.23.88"
            ],
            methods: ["GET", "POST", "PUT", "DELETE"],
        }
    }
);

module.exports = SocketIO;
