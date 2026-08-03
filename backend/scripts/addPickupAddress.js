import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.join(__dirname, "../.env"),
});

import User from "../models/user.model.js";
import Product from "../models/product.model.js";
import Category from "../models/category.model.js";

const updateProducts = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB\n");

    const user = await User.findOne({ email: "samrat@gmail.com" });
    if (!user) {
      console.error("User not found!");
      process.exit(1);
    }

    console.log(`User: ${user.name} (${user.email}) - Role: ${user.role}`);

    // Find the 8 products we created (the ones with proper SKUs)
    const skus = ["SM-HP-001", "UT-SH-001", "AC-VS-001", "GE-SR-001", "FF-YM-001", "MP-BK-001", "BB-TY-001", "SL-JR-001"];

    const result = await Product.updateMany(
      { creator: user._id, sku: { $in: skus } },
      { $set: { pickupAddress: "tarajan kakoti gaon jorhat, 785001" } }
    );

    console.log(`\n✅ Updated ${result.matchedCount} products with pickup address`);
    console.log(`   Modified: ${result.modifiedCount}`);

    // Verify
    const updatedProducts = await Product.find({ creator: user._id, sku: { $in: skus } })
      .select("title sku pickupAddress")
      .lean();

    console.log("\n=== Updated Products ===");
    for (const p of updatedProducts) {
      console.log(`  ${p.title} (${p.sku}): ${p.pickupAddress}`);
    }

    await mongoose.disconnect();
    console.log("\nDisconnected from MongoDB");
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
};

updateProducts();