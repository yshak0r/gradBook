const express = require("express");
const {
  likeProfile,
  saveProfile,
  commentOnProfile,
  getLikedProfiles,
  getSavedProfiles,
  getComments,
} = require("../../controllers/user_controller");
const router = express.Router();

router.route("/like").post(likeProfile);
router.route("/save").post(saveProfile);
router.route("/comment").post(commentOnProfile);
router.route("/liked").get(getLikedProfiles);
router.route("/saved").get(getSavedProfiles);
router.route("/comments").get(getComments);

// //////////////////////////////////////////////////////
// router.route("/").get(getRandomProfiles);
// router.route("/people:id").get(getPeopleYouMayKnow);
// router.route("/rated").get(getMostLiked);

// router.route("/forget-password").post(forgetPassword);
// router.route("/reset-password").post(resetPassword);
// router.route("/liked").get(getLikedProfiles);
// router.route("/saved").get(getSavedProfiles);

// router.route("/password/:id").put(updatePassword);
// router.route("/:id").delete(deleteUser);
// router.route("/").get(getAllUsers);
// // Add social links

// router.route("/:id").get(getProfileDetails);
// router.route("/notifications").get(getNotifications);

// router.route("/update").put(updateUser);
// router.route("/comment/:id").get(getComment);

module.exports = router;
