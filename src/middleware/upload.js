const util = require("util");
const multer = require("multer");
const { MAX_UPLOAD_SIZE, STORAGE_FOLDER } = require("../config/secrets.config");
const path = require("path");

const maxSize = MAX_UPLOAD_SIZE * 1024 * 1024;
const rename = (originalName = "abc.jpg") => {
  const name = originalName.split(".");
  const ext = name[name.length - 1];
  name.splice(name.length - 1);
  const renamed =
    name.join("") +
    "-" +
    new Date().toISOString().replace(/:/g, "-") +
    "." +
    ext;
  return renamed;
};
const fileFilter = (req, file, cb) => {
  if (["image/png", "image/jpg", "image/jpeg"].includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};
let storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, "../../", STORAGE_FOLDER);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const name = rename(file.originalname);
    cb(null, name);
  },
});

let uploadFile = multer({
  storage: storage,
  limits: { fileSize: maxSize },
  fileFilter,
}).single("file");

let uploadFileMiddleware = util.promisify(uploadFile);
module.exports = uploadFileMiddleware;
