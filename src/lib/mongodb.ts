// src/lib/mongodb.ts
import mongoose from 'mongoose';
import { trace } from '@opentelemetry/api';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/atlan-obs';

// Buggy connection (doesn't handle connection properly)
export async function connectToDBBuggy() {
  return mongoose.connect(MONGODB_URI);
}

// Fixed connection with proper tracing and error handling
export async function connectToDB() {
  const tracer = trace.getTracer('mongodb-operations');
  const span = tracer.startSpan('db.connect');
  try {
    if (mongoose.connection.readyState >= 1) {
      span.end();
      return;
    }
    span.setAttribute('db.system', 'mongodb');
    span.setAttribute('db.name', 'atlan-obs');
    await mongoose.connect(MONGODB_URI);
    span.end();
  } catch (error) {
    span.recordException(error as Error);
    span.end();
    throw error;
  }
}

// User model
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  createdAt: { type: Date, default: Date.now }
});

export const User = mongoose.models.User || mongoose.model('User', userSchema);
