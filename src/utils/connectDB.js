const mongoose = require("mongoose");

const connectDB = async () => {
  const MONGOURL = process.env.MONGO_URL;

  if (!MONGOURL) {
    throw new Error("MONGO_URL is not defined");
  }

  await mongoose.connect(MONGOURL);
};

module.exports = connectDB;
