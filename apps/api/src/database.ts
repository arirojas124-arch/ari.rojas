import mongoose from 'mongoose';
import { config } from './config.js';

export async function connectDatabase() {
  if (!config.MONGODB_URI) {
    return false;
  }

  await mongoose.connect(config.MONGODB_URI, {
    serverSelectionTimeoutMS: config.MONGODB_CONNECT_TIMEOUT_MS
  });
  return true;
}