const mongoose = require("mongoose");

const connectDb = async () => {
  try {
    const conn = await mongoose.connect(
      "mongodb://localhost:27017/gradBook_db"
    );
    console.log("Database Connected");
  } catch (error) {
    console.log("error:", error);
    process.exit(1);
  }
};

module.exports = connectDb;
