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
  },
  { timestamps: true }
);

const College = mongoose.model("College", collegeSchema);
module.exports = College;
