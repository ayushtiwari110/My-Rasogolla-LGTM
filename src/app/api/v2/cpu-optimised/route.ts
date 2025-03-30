// src/app/api/v2/cpu-optimized/route.ts
import { trace } from '@opentelemetry/api';
import { NextResponse } from 'next/server';
import { withMetrics } from '@/lib/with-metrics';


export async function GEThandler(request: Request) {
  const tracer = trace.getTracer('next-app');
  const span = tracer.startSpan('cpu-operation');
  const url = new URL(request.url);
  
  try {
    // Get iterations from query param with reasonable default
    const iterations = Math.min(
      parseInt(url.searchParams.get('iterations') || '1000000'),
      5000000 // Cap at reasonable max
    );
    
    span.setAttribute('operation.iterations', iterations);
    
    globalThis.logger?.info({
      operation: 'cpuOperation',
      iterations,
      message: 'Starting CPU-intensive calculation'
    });
    
    const startTime = process.hrtime.bigint();
    
    // Split work into chunks for better responsiveness
    let result = 0;
    const chunkSize = 500000;
    
    for (let chunk = 0; chunk < iterations; chunk += chunkSize) {
      const end = Math.min(chunk + chunkSize, iterations);
      
      // Process chunk
      for (let i = chunk; i < end; i++) {
        result += Math.sqrt(i) * 0.5; // More predictable than random
      }
      
      // Allow event loop to breathe between chunks
      await new Promise(resolve => setTimeout(resolve, 0));
    }
    
    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - startTime) / 1_000_000; // ms
    
    // Track CPU operation metrics
    globalThis.metrics?.cpuOperationDurationMs?.observe(duration);
    
    globalThis.logger?.info({
      operation: 'cpuOperation',
      iterations,
      duration,
      message: 'CPU-intensive calculation completed'
    });
    
    span.setAttribute('operation.duration_ms', duration);
    span.end();
    
    return NextResponse.json({ 
      result,
      meta: {
        iterations,
        duration
      }
    });
  } catch (error: any) {
    span.recordException(error);
    span.end();
    
    globalThis.logger?.error({
      err: error,
      operation: 'cpuOperation',
      message: 'CPU calculation failed'
    });
    
    return NextResponse.json({ 
      error: 'Calculation failed',
      message: error.message
    }, { status: 500 });
  }
}

export const GET = withMetrics(GEThandler);