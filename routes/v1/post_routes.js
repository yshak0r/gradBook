const express = require("express");
const router = express.Router();
const { getPost } = require("../../controllers/post_controller");

router.route("/post/:userId").get(getPost);

module.exports = router;
