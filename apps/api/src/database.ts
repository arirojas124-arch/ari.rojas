import mongoose from 'mongoose';
import type { NextFunction, Request, Response } from 'express';
import { config } from './config.js';

let databaseConnected = false;

export function isDatabaseConnected() {
  return databaseConnected;
}

export async function connectDatabase() {
  if (!config.MONGODB_URI) {
    return false;
  }

  await mongoose.connect(config.MONGODB_URI, {
    serverSelectionTimeoutMS: config.MONGODB_CONNECT_TIMEOUT_MS
  });
  databaseConnected = true;
  return true;
}

export function requireDatabase(_request: Request, response: Response, next: NextFunction) {
  if (!databaseConnected) {
    response.status(503).json({ error: { code: 'DATABASE_UNAVAILABLE', message: 'Database is not available. Check MongoDB Atlas network access.' } });
    return;
  }

  next();
}