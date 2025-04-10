const User = require("../models/user_model");
const Department = require("../models/department_model");
const College = require("../models/college_model");
const Campus = require("../models/campus_model");
const { default: mongoose } = require("mongoose");

const getAllDepartments = async (req, res) => {
  try {
    const departments = await Department.find()
      .select("name departmentId")
      .sort({ searchPoints: -1 }); // Sort by searchPoints in descending order

    res.status(200).json(departments);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Error fetching departments",
      message: error.message,
    });
  }
};

const getAllColleges = async (req, res) => {
  try {
    const colleges = await College.find()
      .select("name collegeId")
      .sort({ searchPoints: -1 }); // Sort by searchPoints in descending order

    res.status(200).json(colleges);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Error fetching colleges",
      message: error.message,
    });
  }
};

const getAllCampuses = async (req, res) => {
  try {
    const campuses = await Campus.find()
      .sort({ searchPoints: -1 })
      .select("name campusId"); // Sort by searchPoints in descending order

    res.status(200).json(campuses);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Error fetching campuses",
      message: error.message,
    });
  }
};

const getSuggested = async (req, res) => {
  try {
    const _id = req.query._id;

    // 1. Get users liked by the target user
    const user = await User.findById(_id).select("likes");
    console.log(user);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    // 2. Get users liked by those users (2nd degree connections)
    const likedUsers = await User.find({ _id: { $in: user.likes } })
      .select("likes")
      .limit(10);

    // Get users liked by the liked users
    const secondDegreeLikes = [];
    for (const likedUser of likedUsers) {
      secondDegreeLikes.push(...likedUser.likes);
    }

    // Get unique users from second degree likes
    const uniqueSecondDegreeLikes = [...new Set(secondDegreeLikes)];
    const secondDegreeUsers = await User.find({
      _id: {
        $in: uniqueSecondDegreeLikes,
        $ne: _id, // Exclude the requesting user
      },
    })
      .select("firstName lastName surname username email photo graduationYear")
      .limit(10);

    // 3. Get users with similar academic background
    const targetUser = await User.findById(_id).select(
      "college department graduationYear"
    );

    const similarUsers = await User.find({
      _id: { $ne: _id }, // Exclude the requesting user
      college: targetUser.college,
      department: targetUser.department,
      graduationYear: targetUser.graduationYear,
    })
      .select("firstName lastName surname username email photo graduationYear")
      .limit(10);

    for (i in similarUsers) {
      console.log("similarUser:" + i);
    }

    // Combine and deduplicate results
    const allSuggestedUsers = [...secondDegreeUsers, ...similarUsers];

    const uniqueSuggestedUsers = Array.from(
      new Map(
        allSuggestedUsers.map((user) => [user._id.toString(), user])
      ).values()
    );

    res.status(200).json(uniqueSuggestedUsers);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Error getting suggested users",
      message: error.message,
    });
  }
};

const search = async (req, res) => {
  try {
    const profiles = await User.find();
    res.status(200).json(profiles);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Error searching profiles",
      message: error.message,
    });
  }
};

module.exports = {
  getAllDepartments,
  getAllColleges,
  getAllCampuses,
  getSuggested,
  search,
};
