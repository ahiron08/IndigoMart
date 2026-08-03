import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.join(__dirname, "../.env"),
});

import PricingSlab from "../models/pricingSlab.model.js";

const slabs = [
  { minPrice: 0, maxPrice: 500, marginAmount: 50, marginType: "fixed", description: "₹0 - ₹500", isActive: true },
  { minPrice: 501, maxPrice: 1000, marginAmount: 80, marginType: "fixed", description: "₹501 - ₹1,000", isActive: true },
  { minPrice: 1001, maxPrice: 2500, marginAmount: 120, marginType: "fixed", description: "₹1,001 - ₹2,500", isActive: true },
  { minPrice: 2501, maxPrice: 5000, marginAmount: 200, marginType: "fixed", description: "₹2,501 - ₹5,000", isActive: true },
  { minPrice: 5001, maxPrice: 10000, marginAmount: 350, marginType: "fixed", description: "₹5,001 - ₹10,000", isActive: true },
  { minPrice: 10001, maxPrice: 999999, marginAmount: 500, marginType: "fixed", description: "₹10,001+", isActive: true },
];

const seedSlabs = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    await PricingSlab.deleteMany({});
    console.log("Cleared existing pricing slabs");

    await PricingSlab.insertMany(slabs);
    console.log("Seeded pricing slabs:", slabs.map((s) => `${s.description} → +₹${s.marginAmount}`).join(", "));

    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding pricing slabs:", error);
    process.exit(1);
  }
};

seedSlabs();