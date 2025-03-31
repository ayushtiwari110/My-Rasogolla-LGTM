// src/app/api/v1/users/route.ts
import { User, connectToDBBuggy } from '@/lib/mongodb';
import { withMetrics } from '@/lib/with-metrics';
import { NextResponse } from 'next/server';

async function GEThandler() {
  if (Math.random() < 0.1) {
    throw new Error("Random error occurred");
  }
  try {
    // No timeout handling
    await connectToDBBuggy();
    
    // Inefficient query - fetches ALL users and doesn't limit fields
    const users = await User.find({});
    
    // Simulate slow processing
    await new Promise(resolve => setTimeout(resolve, Math.random() * 2000));
    
    return NextResponse.json({ users });
  } catch (error: any) {
    // Poor error handling - doesn't log properly
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}

async function POSThandler(request: Request) {
  try {
    await connectToDBBuggy();
    
    const data = await request.json();
    // No validation
    const newUser = new User(data);
    // No timeout set
    await newUser.save();
    
    return NextResponse.json({ user: newUser });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}

export const GET = withMetrics(GEThandler);
export const POST = withMetrics(POSThandler);