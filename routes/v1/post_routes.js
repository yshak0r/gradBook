const express = require("express");
const router = express.Router();
const {
  getPost,
  getLikedPosts,
  getSavedPosts,
} = require("../../controllers/post_controller");

router.route("/").get(getPost);
router.route("/liked").get(getLikedPosts);
router.route("/saved").get(getSavedPosts);
// router.route("/comments").get(getCommentsOnPost);
// router.route("/like").post(likePost);
// router.route("/save").post(savePost);
// router.route("/comment").post(commentOnPost);

module.exports = router;
