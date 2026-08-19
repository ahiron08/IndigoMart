import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });

import { seedShippingDefaults } from "../services/shipping/seed.js";

/**
 * Seed default shipping zones, rate cards, zone rules, config and a few PINs.
 * Idempotent: existing records are left untouched.
 *
 * Usage: node scripts/seedShipping.js
 */
const run = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB.");

    const result = await seedShippingDefaults();
    console.log("Shipping seed finished.", JSON.stringify(result));

    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding shipping data:", error);
    process.exit(1);
  }
};

run();