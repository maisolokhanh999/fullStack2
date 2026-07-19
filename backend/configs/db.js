import mongoose from "mongoose";
import dns from "dns";

dns.setServers(["8.8.8.8", "8.8.4.4"]);
const connectDB = async () => {
  try {
    const uri =
      process.env.MONGODB_URL ||
      process.env.MONGODB_URI ||
      process.env.MONGO_URI ||
      process.env.CONST_MONGODB_URL;

    if (!uri) {
      throw new Error("Missing MongoDB URI. Set MONGODB_URL (or MONGO_URI) in .env");
    }
    await mongoose.connect(uri);


    console.log("✅ MongoDB Connected");
  } catch (error) {
    console.error("❌ MongoDB Error:", error.message);
    process.exit(1);
  }
};

export default connectDB;