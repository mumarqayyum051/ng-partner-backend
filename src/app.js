const cors = require("cors");
const path = require("path");
const logger = require("morgan");
const helmet = require("helmet");
const dotenv = require("dotenv");
const express = require("express");
const mongoose = require("mongoose");
const compression = require("compression");

dotenv.config();

// User Routers
const authRouter = require("./auth/auth.route");
const usersRouter = require("./users/user.route");
const friendsRouter = require("./friends/friends.route");
const messagesRouter = require("./messages/messages.route");
const conversationsRouter = require("./chat2/chat.route");
const filesRouter = require("./files/files.route");

const { MONGODB_URI } = require("./config/secrets.config");
const {
  logErrors,
  errorHandler,
  clientErrorHandler,
  validationErrorHandler,
} = require("./utils/errorHandlers");

const app = express();

// Connect ot database server.
mongoose.Promise = global.Promise;
mongoose.connect(MONGODB_URI, {
  useCreateIndex: true,
  useNewUrlParser: true,
  useFindAndModify: false,
  useUnifiedTopology: true,
});
var allowedOrigins = [
  "http://localhost:4200",
  "http://localhost:4100",
  "http://localhost:4300",
  "http://localhost:3000",
  "https://localhost:4200",
  "https://localhost:4100",
  "https://localhost:4300",
  "https://localhost:3000",
  "https://partneur-backend.herokuapp.com",
];
// Express settings
app.use("*", cors());
app.use(express.json({ limit: "50mb" }));
app.use(helmet.hidePoweredBy());
app.use(logger("dev"));
app.use(compression());
app.use(
  express.urlencoded({ limit: "50mb", extended: true, parameterLimit: 50000 })
);
app.use(express.static(path.join(__dirname, "/public")));
app.use(express.static(path.resolve(__dirname, "../../client", "build")));

const currPath = __dirname;
// User APIs
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/users", usersRouter);
app.use("/api/v1/friends", friendsRouter);
app.use("/api/v1/messages", messagesRouter);
app.use("/api/v1/conversations", conversationsRouter);
app.use("/api/v1/files", filesRouter);

// Api not found
// app.use('/api/*', (req, res) => {
//
//   res.status(404).json({
//     code: 404,
//     error: 'NOT_FOUND',
//     message: 'Not found',
//   });
// });

// // Serve static assets on not found.
// app.get('*', (req, res) => {
//   res.sendFile(path.join(__dirname, '../../client/build/index.html'), (err) => {
//     if (err) res.status(500).send(err);
//   });
// });

// Error handlers
app.use(validationErrorHandler);
app.use(logErrors);
app.use(clientErrorHandler);
app.use(errorHandler);
module.exports = app;
