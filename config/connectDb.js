const mongoose = require("mongoose");

const connectDb = async () => {
  try {
    if (!process.env.MONGODB_KEY) {
      throw new Error("MONGODB_KEY environment variable is not set");
    }

    const connect = await mongoose.connect(process.env.MONGODB_KEY, {
      serverSelectionTimeoutMS: 30000,
      connectTimeoutMS: 15000,
    });
    console.log(
      "Database connected:",
      connect.connection.host,
      connect.connection.name
    );
    return connect;
  } catch (err) {
    console.error("MongoDB connection error:", err?.message || err);
    // Don't exit - let the server continue running
    // The server can retry or handle errors gracefully
    throw err; // Re-throw so caller can handle it
  }
};

module.exports = connectDb;
