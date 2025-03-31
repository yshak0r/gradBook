const mongoose = require("mongoose");
const Department = require("../models/department_model");
const College = require("../models/college_model");
const Campus = require("../models/campus_model");

const connectDb = async () => {
  try {
    const conn = await mongoose.connect(
      "mongodb+srv://admin:admin@nodexpress.ped78m1.mongodb.net/gradBook_db?retryWrites=true&w=majority&appName=nodexpress"
    );
    console.log("Database Connected");
  } catch (error) {
    console.log("error:", error);
    process.exit(1);
  }
};

module.exports = connectDb;
