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

// Exact pricing table from the platform fee sheet
const slabs = [
  { minPrice: 1, maxPrice: 99, marginAmount: 20, marginType: "fixed", description: "₹1 - ₹99", isActive: true },
  { minPrice: 100, maxPrice: 199, marginAmount: 30, marginType: "fixed", description: "₹100 - ₹199", isActive: true },
  { minPrice: 200, maxPrice: 299, marginAmount: 40, marginType: "fixed", description: "₹200 - ₹299", isActive: true },
  { minPrice: 300, maxPrice: 499, marginAmount: 50, marginType: "fixed", description: "₹300 - ₹499", isActive: true },
  { minPrice: 500, maxPrice: 749, marginAmount: 70, marginType: "fixed", description: "₹500 - ₹749", isActive: true },
  { minPrice: 750, maxPrice: 999, marginAmount: 90, marginType: "fixed", description: "₹750 - ₹999", isActive: true },
  { minPrice: 1000, maxPrice: 1499, marginAmount: 120, marginType: "fixed", description: "₹1,000 - ₹1,499", isActive: true },
  { minPrice: 1500, maxPrice: 1999, marginAmount: 150, marginType: "fixed", description: "₹1,500 - ₹1,999", isActive: true },
  { minPrice: 2000, maxPrice: 2999, marginAmount: 200, marginType: "fixed", description: "₹2,000 - ₹2,999", isActive: true },
  { minPrice: 3000, maxPrice: 4999, marginAmount: 300, marginType: "fixed", description: "₹3,000 - ₹4,999", isActive: true },
  { minPrice: 5000, maxPrice: 6999, marginAmount: 600, marginType: "fixed", description: "₹5,000 - ₹6,999", isActive: true },
  { minPrice: 7000, maxPrice: 999999, marginAmount: 600, marginType: "fixed", description: "₹7,000+", isActive: true },
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