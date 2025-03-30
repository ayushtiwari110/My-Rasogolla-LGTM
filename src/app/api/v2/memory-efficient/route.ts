// src/app/api/v2/memory-efficient/route.ts
import { trace } from '@opentelemetry/api';
import { NextResponse } from 'next/server';
import { withMetrics } from '@/lib/with-metrics';

export async function GEThandler() {
  const tracer = trace.getTracer('next-app');
  const span = tracer.startSpan('memory-operation');
  
  try {
    span.setAttribute('operation.type', 'memory-test');
    
    // Process data without storing it
    const results = [];
    for (let i = 0; i < 1000; i++) {
      // Process without keeping references
      const item = {
        id: crypto.randomUUID(),
        processed: true
      };
      results.push(item);
    }
    
    // Track memory usage
    const memoryUsage = process.memoryUsage();
    globalThis.metrics?.nodejsMemoryHeapUsedBytes?.set(memoryUsage.heapUsed);
    
    globalThis.logger?.info({
      operation: 'memoryEfficient',
      heapUsed: memoryUsage.heapUsed,
      message: 'Memory efficient operation completed'
    });
    
    span.end();
    return NextResponse.json({ 
      message: 'Operation completed efficiently',
      processedItems: results.length
    });
  } catch (error: any) {
    span.recordException(error);
    span.end();
    
    globalThis.logger?.error({
      err: error,
      operation: 'memoryEfficient',
      message: 'Operation failed'
    });
    
    return NextResponse.json({ 
      error: 'Operation failed',
      message: error.message
    }, { status: 500 });
  }
}

export const GET = withMetrics(GEThandler);