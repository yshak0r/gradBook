const express = require("express");
const router = express.Router();

router.route("/").get(getRandomProfiles);
router.route("/people:id").get(getPeopleYouMayKnow);
router.route("/rated").get(getMostLiked);

router.route("/forget-password").post(forgetPassword);
router.route("/reset-password").post(resetPassword);
router.route("/liked").get(getLikedProfiles);
router.route("/saved").get(getSavedProfiles);

router.route("/password/:id").put(updatePassword);
router.route("/:id").delete(deleteUser);
router.route("/").get(getAllUsers);
// Add social links

router.route("/:id").get(getProfileDetails);
router.route("/notifications").get(getNotifications);
router.route("/like/:id").post(likeUser);
router.route("/save/:id").post(saveUser);
router.route("/update").put(updateUser);
router.route("/comment/:id").post(comment);
router.route("/comment/:id").get(getComment);

module.exports = router;
