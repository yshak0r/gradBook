const Post = require("../models/post_model");
const User = require("../models/user_model");

const getPost = async (req, res) => {
  try {
    const { userId } = req.params;

    // Find user and their liked posts
    const user = await User.findById(userId).populate("likedPosts");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Find users who liked the same posts
    const similarUsers = await User.find({
      likedPosts: { $in: user.likedPosts },
      _id: { $ne: userId }, // Exclude the current user
    });

    // Collect all the posts liked by similar users
    const postIds = similarUsers.flatMap((u) => u.likedPosts);

    // Find posts that these similar users liked, excluding posts already liked by the current user
    const recommendedPosts = await Post.find({
      _id: {
        $in: postIds,
        $nin: user.likedPosts,
      },
    }).populate([
      {
        path: "user",
        select: "username firstName lastName surname photo coverImage",
      },
    ]);

    // Transform posts into the required format
    const transformedPosts = recommendedPosts.map((post) => {
      // Determine post type based on content
      const type = post.question ? "quote" : "other";

      // Calculate number of likes and comments
      const noOfLikes = post.likes ? post.likes.length : 0;
      const noOfComments = post.comments ? post.comments.length : 0;

      // Check if current user has liked this post
      const isLiked = user.likedPosts.some(
        (likedPost) => likedPost._id.toString() === post._id.toString()
      );

      return {
        postId: post._id,
        user: {
          username: post.user.username,
          firstName: post.user.firstName,
          lastName: post.user.lastName,
          surname: post.user.surname,
          photo: post.user.photo,
          coverImage: post.user.coverImage,
        },
        noOfLikes,
        isLiked,
        noOfComments,
        type,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
      };
    });

    return res.status(200).json({
      success: true,
      data: transformedPosts,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching recommended posts",
      error: error.message,
    });
  }
};

module.exports = { getPost };
