import dns from "node:dns";

dns.setServers(["1.1.1.1", "8.8.8.8"]);

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Category from '../models/category.model.js';

import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.join(__dirname, "../.env"),
});

const categories = [
  {
    name: 'Paintings',
    slug: 'paintings',
    description: 'Oil, acrylic, watercolour paintings and sketches',
    sortOrder: 1
  },
  {
    name: 'Handmade Crafts',
    slug: 'handmade-crafts',
    description: 'Bamboo, cane, wooden, wool and traditional handcrafted products',
    sortOrder: 2
  },
  {
    name: 'Home & Décor',
    slug: 'home-decor',
    description: 'Wall art, sculptures, pottery, clay art and home décor',
    sortOrder: 3
  },
  {
    name: 'Textiles',
    slug: 'textiles',
    description: 'Handwoven fabrics, apparel and textile products',
    sortOrder: 4
  },
  {
    name: 'Jewelry',
    slug: 'jewelry',
    description: 'Handmade jewelry and artisan accessories',
    sortOrder: 5
  },
  {
    name: 'Accessories',
    slug: 'accessories',
    description: 'Handcrafted fashion and lifestyle accessories',
    sortOrder: 6
  },
  {
    name: 'Gifts',
    slug: 'gifts',
    description: 'Unique handmade gifts and personalized creations',
    sortOrder: 7
  },
  {
    name: 'Collections',
    slug: 'collections',
    description: 'Curated collections of authentic artisan products',
    sortOrder: 8
  }
];

const seedCategories = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing categories
    await Category.deleteMany({});
    console.log('Cleared existing categories');

    // Insert new categories
    await Category.insertMany(categories);
    console.log('Categories seeded successfully:', categories.map(c => c.name));

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding categories:', error);
    process.exit(1);
  }
};

seedCategories();