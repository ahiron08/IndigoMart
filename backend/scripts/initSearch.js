/**
 * One-time script to initialize the semantic search system.
 * Run: node scripts/initSearch.js
 *
 * This script will:
 * 1. Ensure Qdrant collection exists
 * 2. Rebuild all product embeddings
 */
import dns from "node:dns";

dns.setServers(["1.1.1.1", "8.8.8.8"]);

import 'dotenv/config';
import { connectToDatabase, disconnectFromDatabase } from '../config/database.js';
import { ensureCollection, batchIndexProducts } from '../services/vector.service.js';
import Product from '../models/product.model.js';

const run = async () => {
  try {
    await connectToDatabase();
    console.log('Connected to MongoDB.\n');

    // Ensure Qdrant collection exists
    console.log('Ensuring Qdrant collection exists...');
    const collectionReady = await ensureCollection();
    if (!collectionReady) {
      console.error('Failed to ensure Qdrant collection. Exiting.');
      await disconnectFromDatabase();
      process.exit(1);
    }
    console.log('Qdrant collection is ready.\n');

    // Fetch all products
    console.log('Fetching products from MongoDB...');
    const products = await Product.find({ isDeleted: { $ne: true } }).lean();
    console.log(`Found ${products.length} products.\n`);

    if (products.length === 0) {
      console.log('No products to index. Exiting.');
      await disconnectFromDatabase();
      process.exit(0);
    }

    // Batch index products
    console.log('Starting batch indexing...');
    const result = await batchIndexProducts(products);

    console.log('\n=== Indexing Complete ===');
    console.log(`Successfully indexed: ${result.success}`);
    console.log(`Failed: ${result.failed}`);
    console.log(`Skipped: ${result.skipped}`);

    await disconnectFromDatabase();
    process.exit(0);
  } catch (error) {
    console.error('Error initializing search:', error.message);
    await disconnectFromDatabase();
    process.exit(1);
  }
};

run();