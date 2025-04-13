const User = require("../models/user_model");
const Comment = require("../models/comment_model");
const Notification = require("../models/notification_model");

// Prevent liking one's own self?

const likeProfile = async (req, res) => {
  try {
    const { userId, targetUserId } = req.body;

    // Check if both users exist
    const [user, targetUser] = await Promise.all([
      User.findOne({ username: userId }),
      User.findOne({ username: targetUserId }),
    ]);

    if (!user || !targetUser) {
      return res.status(404).json({
        isDone: false,
        message: "User not found",
      });
    }

    // Check if already liked
    const isAlreadyLiked = user.likes.includes(targetUser._id);
    console.log("already liked" + isAlreadyLiked);

    if (isAlreadyLiked) {
      // Unlike the profile

      user.likes = user.likes.filter((id) => {
        return id.toString() !== targetUser._id.toString();
      });
      await user.save();

      // targetUser.numberOfLikes -= 1;
      // await targetUser.save();

      return res.status(200).json({
        message: "Profile unliked successfully",
        isDone: true,
      });
    } else {
      // Like the profile

      user.likes.push(targetUser._id);
      await user.save();

      // targetUser.numberOfLikes += 1;
      // await targetUser.save();

      // Create notification for the target user
      await Notification.create({
        user: targetUser._id,
        type: "like",
        fromUser: user._id,
      });

      return res.status(200).json({
        message: "Profile liked successfully",
        isDone: true,
      });
    }
  } catch (error) {
    return res.status(500).json({
      message: "Error processing like action",
      isDone: false,
      error: error.message,
    });
  }
};

const saveProfile = async (req, res) => {
  try {
    const { userId, targetUserId } = req.body;

    // Check if both users exist
    const [user, targetUser] = await Promise.all([
      User.findOne({ username: userId }),
      User.findOne({ username: targetUserId }),
    ]);

    if (!user || !targetUser) {
      return res.status(404).json({
        message: "User not found",
        isDone: false,
      });
    }

    // Check if already saved
    const isAlreadySaved = user.savedProfiles.includes(targetUser._id);
    console.log("already saved: " + isAlreadySaved);

    if (isAlreadySaved) {
      // Remove from saved profiles
      user.savedProfiles = user.savedProfiles.filter(
        (id) => id.toString() !== targetUser._id.toString()
      );
      await user.save();

      return res.status(200).json({
        message: "Profile removed from saved profiles",
        isDone: false,
      });
    } else {
      // Add to saved profiles
      user.savedProfiles.push(targetUser._id);
      await user.save();

      return res.status(200).json({
        message: "Profile saved successfully",
        isDone: true,
      });
    }
  } catch (error) {
    return res.status(500).json({
      message: "Error processing save action",
      isDone: false,
      error: error.message,
    });
  }
};

const commentOnProfile = async (req, res) => {
  try {
    const { userId, targetUserId, text } = req.body;

    // Check if both users exist
    const [user, targetUser] = await Promise.all([
      User.findOne({ username: userId }),
      User.findOne({ username: targetUserId }),
    ]);

    if (!user || !targetUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if target user's comment privacy is private

    // Create new comment
    const comment = await Comment.create({
      user: user._id,
      profile: targetUser._id,
      text: text,
    });

    // Add comment to target user's comments array
    targetUser.comments.push(comment._id);
    await targetUser.save();

    // Create notification for the target user
    await Notification.create({
      user: targetUser._id,
      type: `comment`,
      fromUser: user._id,
    });

    return res.status(200).json({
      message: "Comment added successfully",
      isDone: true,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error processing comment action",
      error: error.message,
    });
  }
};

const getLikedProfiles = async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await User.findOne({ username: userId }).select("likes");

    if (!user) {
      return res.status(404).json({
        isDone: false,
        message: "User not found",
      });
    }
    return res.status(200).json({
      isDone: true,
      user,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error getting liked profiles",
      isDone: false,
      error: error.message,
    });
  }
};

const getSavedProfiles = async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await User.findOne({ username: userId }).select(
      "savedProfiles"
    );

    if (!user) {
      return res.status(404).json({
        isDone: false,
        message: "User not found",
      });
    }
    return res.status(200).json({
      isDone: true,
      user,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error getting saved profiles",
      isDone: false,
      error: error.message,
    });
  }
};

const getComments = async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await User.findOne({ username: userId }).select("comments");

    if (!user) {
      return res.status(404).json({
        isDone: false,
        message: "User not found",
      });
    }
    return res.status(200).json({
      isDone: true,
      user,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error getting comments of a user",
      isDone: false,
      error: error.message,
    });
  }
};

module.exports = {
  likeProfile,
  saveProfile,
  commentOnProfile,
  getLikedProfiles,
  getSavedProfiles,
  getComments,
};
