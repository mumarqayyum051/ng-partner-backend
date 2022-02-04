const uploadFile = require("../middleware/upload");
const fs = require("fs");
const { STORAGE_FOLDER } = require("../config/secrets.config");
const path = require("path");
/* =============================================================================
  POST /upload
============================================================================= */
exports.upload = async (req, res) => {
  try {
    await uploadFile(req, res);

    if (req.file == undefined) {
      return res.status(400).send({
        message: "Please upload a .jpg, .jpeg or .png image",
      });
    }
    const serverUrl = `${req.protocol}://${req.get("host")}/api/v1/files/`;

    res.status(200).send({
      message: "Uploaded the file successfully",
      url: serverUrl + req.file.filename,
    });
  } catch (err) {
    if (err.code == "LIMIT_FILE_SIZE") {
      return res.status(500).send({
        message: "File size cannot be larger than 2MB!",
      });
    }

    res.status(500).send({
      message: `Could not upload the file: ${
        req.file ? req.file.originalname : ""
      }. ${err}`,
    });
  }
};
/* =============================================================================
  GET /files
============================================================================= */
exports.getListFiles = (req, res) => {
  try {
    const directoryPath = path.join(__dirname, "../../", STORAGE_FOLDER);
    fs.readdir(directoryPath, function (err, files) {
      if (err) {
        console.log(err.message);
        res.status(500).send({
          message: "Unable to scan files!",
        });
        return;
      }
      let fileInfos;
      const serverUrl = `${req.protocol}://${req.get("host")}/api/v1/files/`;

      if (files) {
        fileInfos = files.map((file) => {
          return {
            name: file,
            url: serverUrl + file,
          };
        });
      }
      res.status(200).send(fileInfos);
    });
  } catch (e) {
    res.status(500).send({
      message: "Unable to scan files!",
    });
  }
};
/* =============================================================================
  GET /files/filename
============================================================================= */
exports.download = (req, res) => {
  const fileName = req.params.name;
  const directoryPath = path.join(__dirname, "../../", STORAGE_FOLDER, "/");
  res.download(directoryPath + fileName, fileName, (err) => {
    if (err) {
      res.status(500).send({
        message: "Could not download the file type. " + err,
      });
    }
  });
};
