import mongoose from "mongoose";
import app from "../src/app.js";

const MONGO_URI = process.env.MONGO_URI;

let cachedConnection = null;

async function connectToDatabase() {
  if (cachedConnection) return cachedConnection;
  if (!MONGO_URI) {
    throw new Error("MONGO_URI environment variable is not defined");
  }
  cachedConnection = await mongoose.connect(MONGO_URI);
  return cachedConnection;
}
export default async function handler(req, res) {
  if (req.method !== "OPTIONS") {
    try {
      await connectToDatabase();
    } catch (error) {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
      return res.status(500).json({ 
        message: "Database connection error", 
        error: error.message 
      });
    }
  }
  return app(req, res);
}