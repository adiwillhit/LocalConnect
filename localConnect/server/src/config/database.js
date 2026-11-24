import mongoose from 'mongoose';
import { env } from './environment.js';

export const connectDatabase = async (uri = env.mongoUri) => {
  mongoose.set('strictQuery', true);

  mongoose.connection.on('error', (err) => {
    if (!env.isTest) {
      console.error('MongoDB connection error:', err.message);
    }
  });

  mongoose.connection.on('disconnected', () => {
    if (!env.isTest) {
      console.warn('MongoDB disconnected');
    }
  });

  const conn = await mongoose.connect(uri, {
    autoIndex: true,
    serverSelectionTimeoutMS: 5000,
  });

  if (!env.isTest) {
    console.log(`MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
  }

  return conn;
};

export const disconnectDatabase = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
};

