/**
 * One-time script to create the first admin account.
 * Run: node scripts/createAdmin.js
 *
 * After creation, the admin logs in through the normal login page.
 */
import dns from "node:dns";

dns.setServers(["1.1.1.1", "8.8.8.8"]);



import 'dotenv/config';
import { connectToDatabase, disconnectFromDatabase } from '../config/database.js';
import User from '../models/user.model.js';
import readline from 'node:readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const ask = (query) => new Promise((resolve) => rl.question(query, resolve));

const run = async () => {
  try {
    await connectToDatabase();
    console.log('Connected to MongoDB.\n');

    const email = await ask('Admin email: ');
    const name = await ask('Admin name: ');
    const password = await ask('Admin password (min 8 chars, upper+lower+number): ');

    const existing = await User.findOne({ email });
    if (existing) {
      console.log(`\nA user with email "${email}" already exists.`);
      const override = await ask('Override to admin role? (y/n): ');
      if (override.toLowerCase() === 'y') {
        existing.role = 'admin';
        existing.password = password;
        await existing.save();
        console.log('User updated to admin.');
      } else {
        console.log('Aborted.');
      }
      await disconnectFromDatabase();
      process.exit(0);
    }

    const admin = await User.create({
      name,
      email,
      password,
      role: 'admin',
      isVerified: true,
    });

    console.log(`\nAdmin account created: ${admin.email}`);
    await disconnectFromDatabase();
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin:', error.message);
    await disconnectFromDatabase();
    process.exit(1);
  } finally {
    rl.close();
  }
};

run();