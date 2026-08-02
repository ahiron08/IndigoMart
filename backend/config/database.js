import mongoose from 'mongoose';

import { env } from './env.js';

const connectionStateLabels = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
};

let listenersRegistered = false;

const registerConnectionListeners = () => {
  if (listenersRegistered) return;

  mongoose.connection.on('error', (error) => {
    console.error('MongoDB connection error:', error.message);
  });
  mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB disconnected.');
  });
  mongoose.connection.on('reconnected', () => {
    console.log('MongoDB reconnected.');
  });

  listenersRegistered = true;
};

export const connectToDatabase = async () => {
  registerConnectionListeners();

  if (mongoose.connection.readyState === 1) return mongoose.connection;

  await mongoose.connect(env.MONGODB_URI, {
    serverSelectionTimeoutMS: 10_000,
    maxPoolSize: 10,
    minPoolSize: env.NODE_ENV === 'production' ? 2 : 0,
    autoIndex: env.NODE_ENV !== 'production',
  });

  console.log(`MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`);
  return mongoose.connection;
};

export const disconnectFromDatabase = async () => {
  if (mongoose.connection.readyState === 0) return;
  await mongoose.disconnect();
};

export const getDatabaseState = () =>
  connectionStateLabels[mongoose.connection.readyState] || 'unknown';
