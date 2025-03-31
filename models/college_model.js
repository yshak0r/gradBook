// college.js
const mongoose = require("mongoose");

const collegeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    campus: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "campus",
      required: true,
    },
    collegeId: {
      type: Number,
      required: true,
    },
    searchPoints: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

const College = mongoose.model("College", collegeSchema);
module.exports = College;
