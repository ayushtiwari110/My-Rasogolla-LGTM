// src/app/api/v2/auth/login/route.ts
import { trace } from '@opentelemetry/api';
import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { withMetrics } from '@/lib/with-metrics';


// Better store (still in-memory but with proper password storage)
const usersSecure = [
  { 
    id: '1', 
    username: 'test', 
    // This would be a hashed password in real world
    passwordHash: crypto.createHash('sha256').update('password').digest('hex') 
  }
];

export async function POSThandler(request: Request) {
  const tracer = trace.getTracer('next-app');
  const span = tracer.startSpan('user-login');
  const requestId = crypto.randomUUID();
  
  try {
    span.setAttribute('request.id', requestId);
    
    const { username, password } = await request.json();
    
    // Validate input
    if (!username || !password) {
      span.setAttribute('auth.validation_failed', true);
      throw new Error('Username and password are required');
    }
    
    span.setAttribute('auth.username', username);
    
    // Log login attempt (without password)
    globalThis.logger?.info({
      requestId,
      operation: 'userLogin',
      username,
      message: 'Login attempt'
    });
    
    // Securely hash password for comparison
    const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
    
    // Efficient lookup (O(1) in real DB)
    const authSpan = tracer.startSpan('auth.validate_credentials');
    const user = usersSecure.find(u => 
      u.username === username && u.passwordHash === passwordHash
    );
    authSpan.end();
    
    if (!user) {
      // Track failed logins
      // globalThis.metrics?.registry.getSingleMetric('login_failures_total')?.inc(1);
      globalThis.metrics?.loginFailuresTotal?.inc(1);
      
      span.setAttribute('auth.success', false);
      
      globalThis.logger?.warn({
        requestId,
        operation: 'userLogin',
        username,
        message: 'Login failed - invalid credentials'
      });
      
      span.end();
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }
    
    // Generate proper JWT (in real app)
    const token = `secure-token-${user.id}-${Date.now()}`;
    
    // Track successful logins
    globalThis.metrics?.loginSuccessTotal?.inc(1);
    
    span.setAttribute('auth.success', true);
    span.setAttribute('user.id', user.id);
    
    globalThis.logger?.info({
      requestId,
      userId: user.id,
      operation: 'userLogin',
      message: 'Login successful'
    });
    
    span.end();
    return NextResponse.json({ 
      token,
      expiresIn: 3600,
      userId: user.id
    });
  } catch (error: any) {
    span.recordException(error);
    span.end();
    
    globalThis.logger?.error({
      err: error,
      requestId,
      operation: 'userLogin',
      message: 'Login failed'
    });
    
    return NextResponse.json({ 
      error: 'Login failed',
      message: error.message
    }, { status: 500 });
  }
}

export const POST = withMetrics(POSThandler);