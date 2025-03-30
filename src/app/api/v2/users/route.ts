// src/app/api/v2/users/route.ts
import { User, connectToDB } from '@/lib/mongodb';
import { trace } from '@opentelemetry/api';
import { NextResponse } from 'next/server';
import { withMetrics } from '@/lib/with-metrics';

export async function GEThandler(request: Request) {
  const tracer = trace.getTracer('next-app');
  const span = tracer.startSpan('get-users');
  const url = new URL(request.url);
  
  try {
    span.setAttribute('request.id', crypto.randomUUID());
    
    // Set query parameters with defaults
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const page = parseInt(url.searchParams.get('page') || '1');
    
    span.setAttribute('query.limit', limit);
    span.setAttribute('query.page', page);
    
    // Connect with proper error handling
    await connectToDB();
    
    // Efficient query with pagination and projection
    const dbSpan = tracer.startSpan('db.find_users');
    const users = await User.find({})
      .select('name email createdAt')
      .limit(limit)
      .skip((page - 1) * limit)
      .lean()
      .exec();
    dbSpan.end();
    
    // Track metrics
    const userCount = await User.countDocuments();
    globalThis.metrics?.dbUserCount?.set(userCount);
    
    // Log success with trace ID for correlation
    globalThis.logger?.info({
      traceId: span.spanContext().traceId,
      operation: 'getUsers',
      userCount: users.length,
      message: 'Successfully retrieved users'
    });
    
    span.end();
    return NextResponse.json({ 
      users,
      pagination: {
        total: userCount,
        limit,
        page,
        pages: Math.ceil(userCount / limit)
      }
    });
  } catch (error: any) {
    // Proper error handling with structured logging
    span.recordException(error);
    span.end();
    
    globalThis.logger?.error({
      err: error,
      operation: 'getUsers',
      message: 'Failed to retrieve users'
    });
    
    return NextResponse.json({ 
      error: 'Failed to retrieve users',
      message: error.message
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const tracer = trace.getTracer('next-app');
  const span = tracer.startSpan('create-user');
  const requestId = crypto.randomUUID();
  
  try {
    span.setAttribute('request.id', requestId);
    
    // Connect with proper error handling
    await connectToDB();
    
    const data = await request.json();
    
    // Validate data
    if (!data.name || !data.email) {
      span.setAttribute('validation.failed', true);
      throw new Error('Name and email are required');
    }
    
    span.setAttribute('user.email', data.email);
    
    // Set timeout and create user with tracing
    const dbSpan = tracer.startSpan('db.create_user');
    const newUser = new User(data);
    await Promise.race([
      newUser.save(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('DB operation timed out')), 5000)
      )
    ]);
    dbSpan.end();
    
    // Record metrics
    globalThis.metrics?.userSignups.inc({
      plan_type: data.plan || "free",
      referral_source: data.referral || "direct"
    });
    
    // Log success
    globalThis.logger?.info({
      requestId,
      traceId: span.spanContext().traceId,
      operation: 'createUser',
      userId: newUser._id.toString(),
      message: 'User created successfully'
    });
    
    span.end();
    return NextResponse.json({ user: newUser });
  } catch (error: any) {
    span.recordException(error);
    span.end();
    
    globalThis.logger?.error({
      err: error,
      requestId,
      operation: 'createUser',
      message: 'Failed to create user'
    });
    
    return NextResponse.json({ 
      error: 'Failed to create user',
      message: error.message
    }, { status: 500 });
  }
}

export const GET = withMetrics(GEThandler);