const mongoose = require("mongoose");

const connectDb = async () => {
  try {
    const conn = await mongoose.connect(
      "mongodb://192.168.142.70:27018/gradBook_db/?directConnection=true"
    );
    console.log("Database Connected");
  } catch (error) {
    console.log("error:", error);
    process.exit(1);
  }
};

module.exports = connectDb;
