import mongoose from 'mongoose';
import { env } from './env';

export async function connectDb(): Promise<void> {
  if (mongoose.connection.readyState === 1) return;

  mongoose.set('strictQuery', true);
  await mongoose.connect(env.MONGODB_URI, {
    maxPoolSize: 10,
    minPoolSize: 1,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  });
  console.log(`MongoDB connected: ${mongoose.connection.host}`);
}

export async function disconnectDb(): Promise<void> {
  await mongoose.disconnect();
}
