import mongoose from "mongoose";

// Global cache for mongoose connection
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

const cached: MongooseCache = (
  global as typeof globalThis & { mongoose?: MongooseCache }
).mongoose || { conn: null, promise: null };

if (!(global as typeof globalThis & { mongoose?: MongooseCache }).mongoose) {
  (global as typeof globalThis & { mongoose: MongooseCache }).mongoose = cached;
}

async function connectDB() {
  const MONGODB_URI = process.env.NEXT_PUBLIC_MONGO_DB_URL || process.env.MONGO_DB_URL || "";
  
  if (!MONGODB_URI) {
    throw new Error(
      "Please define the MONGO_DB_URL environment variable inside .env.local"
    );
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectDB;
