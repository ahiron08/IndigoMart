import dns from "node:dns";
dns.setServers(["1.1.1.1", "8.8.8.8"]);

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

const verifyProducts = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB\n");

    const user = await User.findOne({ email: "samrat@gmail.com" });
    if (!user) {
      console.error("User not found!");
      process.exit(1);
    }

    console.log(`User: ${user.name} (${user.email}) - Role: ${user.role}`);

    const products = await Product.find({ creator: user._id })
      .populate("category", "name slug")
      .sort({ "category.sortOrder": 1 })
      .lean();

    console.log(`\n=== ${products.length} Products for samrat@gmail.com ===\n`);

    for (const p of products) {
      console.log(`[${p.category?.name || "Unknown"}]`);
      console.log(`  Title:       ${p.title}`);
      console.log(`  Price:       ₹${p.price}${p.discountPrice ? ` (Sale: ₹${p.discountPrice}, -${p.discountPercentage}%)` : ""}`);
      console.log(`  Brand:       ${p.brand}`);
      console.log(`  SKU:         ${p.sku}`);
      console.log(`  Stock:       ${p.stock} (${p.stockStatus})`);
      console.log(`  Status:      ${p.status} | Approved: ${p.isApproved}`);
      console.log(`  Slug:        ${p.slug}`);
      console.log(`  Description: ${p.description.substring(0, 80)}...`);
      console.log(`  Tags:        ${p.tags.join(", ")}`);
      console.log(`  Specs:       ${p.specifications.length} specifications`);
      console.log(`  Shipping:    ${p.shippingCharge ? `₹${p.shippingCharge}` : "Free"} | ${p.shippingDetails?.shippingTime || "N/A"}`);
      console.log("");
    }

    // Check categories
    const categories = await Category.find({ isActive: true }).sort({ sortOrder: 1 });
    const categoryNames = categories.map((c) => c.name);
    const productCategoryNames = [...new Set(products.map((p) => p.category?.name))];

    console.log(`All categories: ${categoryNames.join(", ")}`);
    console.log(`Covered categories: ${productCategoryNames.join(", ")}`);
    console.log(`\n✅ All ${categories.length} categories have a product from samrat@gmail.com: ${categoryNames.every((c) => productCategoryNames.includes(c))}`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
};

verifyProducts();