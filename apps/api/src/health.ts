import mongoose from 'mongoose';

export function databaseReady() {
  return mongoose.connection.readyState === 1;
}
