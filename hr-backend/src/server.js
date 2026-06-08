import "dotenv/config";
import mongoose from "mongoose";
import app from "./app.js";

const PORT = process.env.PORT || 5000;

// Priority: 1. ENV variable, 2. Local fallback
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/hr_invoices";

const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI, {
      // FIX 1: Forces IPv4 to resolve the ECONNREFUSED error on Node v20/Windows
      family: 4,

      // FIX 2: Prevents the "pending" hang by timing out if connection is slow
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log("✅ MongoDB connected successfully");

    app.listen(PORT, () => {
      console.log(`🚀 API running on: http://localhost:${PORT}`);
    });

  } catch (e) {
    console.error("❌ Mongo connection failed:", e.message);

    // Check if it's a DNS/SRV issue
    if (e.message.includes("querySrv ESERVFAIL") || e.message.includes("ECONNREFUSED")) {
      console.error("💡 HINT: Try using the 'Standard Connection String' in Atlas (mongodb:// instead of mongodb+srv://)");
    }

    process.exit(1);
  }
};

connectDB();