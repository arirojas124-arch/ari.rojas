import mongoose from 'mongoose';
import type { NextFunction, Request, Response } from 'express';
import { config } from './config.js';

const isConnected = (state: number) => state === mongoose.STATES.connected;
const isConnecting = (state: number) => state === mongoose.STATES.connecting;

let databaseConnected = isConnected(mongoose.connection.readyState);

export function isDatabaseConnected() {
  return isConnected(mongoose.connection.readyState);
}

export async function connectDatabase() {
  if (!config.MONGODB_URI) {
    databaseConnected = false;
    return false;
  }

  if (isConnected(mongoose.connection.readyState)) {
    databaseConnected = true;
    return true;
  }

  if (isConnecting(mongoose.connection.readyState)) {
    await new Promise<void>((resolve, reject) => {
      mongoose.connection.once('connected', () => resolve());
      mongoose.connection.once('error', (error) => reject(error));
    });
    databaseConnected = isConnected(mongoose.connection.readyState);
    return databaseConnected;
  }

  await mongoose.connect(config.MONGODB_URI, {
    serverSelectionTimeoutMS: config.MONGODB_CONNECT_TIMEOUT_MS
  });
  databaseConnected = isConnected(mongoose.connection.readyState);
  return databaseConnected;
}

export function requireDatabase(_request: Request, response: Response, next: NextFunction) {
  if (!isConnected(mongoose.connection.readyState)) {
    response.status(503).json({ error: { code: 'DATABASE_UNAVAILABLE', message: 'Database is not available. Check MongoDB Atlas network access.' } });
    return;
  }

  next();
}