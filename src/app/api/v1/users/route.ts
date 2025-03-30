// src/app/api/v1/users/route.ts
import { User, connectToDBBuggy } from '@/lib/mongodb';

export async function GET() {
  try {
    // No timeout handling
    await connectToDBBuggy();
    
    // Inefficient query - fetches ALL users and doesn't limit fields
    const users = await User.find({});
    
    // Simulate slow processing
    await new Promise(resolve => setTimeout(resolve, Math.random() * 2000));
    
    return Response.json({ users });
  } catch (error: any) {
    // Poor error handling - doesn't log properly
    return Response.json({ error: 'Database error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectToDBBuggy();
    
    const data = await request.json();
    // No validation
    const newUser = new User(data);
    // No timeout set
    await newUser.save();
    
    return Response.json({ user: newUser });
  } catch (error) {
    return Response.json({ error: 'Failed to create user' }, { status: 500 });
  }
}
