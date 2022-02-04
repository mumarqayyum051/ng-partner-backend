const express = require("express");
const router = express.Router();
const { upload, download, getListFiles } = require("./files.controller");

router.post("/upload", upload);
router.get("/", getListFiles);
router.get("/:name", download);

module.exports = router;
