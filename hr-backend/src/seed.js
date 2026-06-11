import bcrypt from "bcryptjs";
import "dotenv/config";
import mongoose from "mongoose";
import User from "./models/User.js";
async function run() {
  const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/hr_invoices";
  await mongoose.connect(uri);
  const email = (process.env.ADMIN_EMAIL || "caraudiocustoms7@gmail.com").toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "Admin@12345";
  const name = process.env.ADMIN_NAME || "Car Audio & Customs Admin";

  const passwordHash = await bcrypt.hash(password, 10);

  const existing = await User.findOne({ email });
  if (existing) {
    existing.passwordHash = passwordHash;
    existing.name = name;
    existing.role = "admin";
    await existing.save();
    console.log(`Updated admin: ${email}`);
  } else {
    await User.create({ email, passwordHash, name, role: "admin" });
    console.log(`Created admin: ${email}`);
  }
  console.log(`Password: ${password}`);
  await mongoose.disconnect();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
