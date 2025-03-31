const { type } = require("express/lib/response");
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      minlength: 3,
    },
    lastName: {
      type: String,
      required: true,
      minlength: 3,
    },
    surname: {
      type: String,
      required: true,
      minlength: 3,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      minlength: 3,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      default: "changeme",
    },
    phoneNumber: {
      type: Number,
      required: true,
    },
    graduationYear: {
      type: Number,
      required: true,
    },
    photo: {
      type: String,
      required: false,
    },
    quote: {
      type: String,
      required: false,
    },
    coverImage: {
      type: String,
    },
    numberOfLikes: {
      type: Number,
    },
    numberOfComments: {
      type: Number,
    },
    campus: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campus",
      required: true,
    },
    college: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "College",
      required: true,
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true,
    },
    socialLinks: {
      telegram: { type: String },
      instagram: { type: String },
      tiktok: { type: String },
      youtube: { type: String },
    },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // Users they liked
    savedProfiles: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // Saved users
    comments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Comment" }],
    views: {
      type: Number,
      default: 0,
    },
    commentPrivacy: {
      type: String,
      enum: ["public", "private"],
      default: "public",
    },
    notifications: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Notification" },
    ],
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

module.exports = User;
