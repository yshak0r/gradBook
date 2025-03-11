const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
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
