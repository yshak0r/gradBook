// university.js
const mongoose = require("mongoose");

const campusSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    campusId: {
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

const Campus = mongoose.model("Campus", campusSchema);
module.exports = Campus;
