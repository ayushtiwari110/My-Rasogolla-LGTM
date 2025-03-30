// src/app/api/v2/external-api/route.ts
import { trace } from '@opentelemetry/api';

export async function GET() {
  const tracer = trace.getTracer('next-app');
  const span = tracer.startSpan('external-api-call');
  const requestId = crypto.randomUUID();
  
  try {
    span.setAttribute('request.id', requestId);
    span.setAttribute('api.endpoint', 'jsonplaceholder');
    
    // Log the request
    globalThis.logger?.info({
      requestId,
      operation: 'externalApiCall',
      endpoint: 'jsonplaceholder',
      message: 'Making external API call'
    });
    
    // With timeout and proper error handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const apiSpan = tracer.startSpan('fetch_external_data');
    const startTime = Date.now();
    
    const response = await fetch('https://jsonplaceholder.typicode.com/posts', {
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    // Track external API latency
    const latency = Date.now() - startTime;
    globalThis.metrics?.externalApiLatencyMs?.observe(latency);
    
    apiSpan.setAttribute('http.status_code', response.status);
    apiSpan.end();
    
    // Check response status
    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }
    
    const data = await response.json();
    
    // Log success
    globalThis.logger?.info({
      requestId,
      operation: 'externalApiCall',
      latency,
      status: response.status,
      message: 'External API call successful'
    });
    
    span.end();
    return Response.json({
      data,
      meta: {
        latency,
        endpoint: 'jsonplaceholder'
      }
    });
  } catch (error: any) {
    span.recordException(error);
    span.end();
    
    // Track failed calls
    globalThis.metrics?.externalApiErrorsTotal?.inc(1);
    
    globalThis.logger?.error({
      err: error,
      requestId,
      operation: 'externalApiCall',
      message: 'External API call failed'
    });
    
    return Response.json({ 
      error: 'External API call failed',
      message: error.message
    }, { status: 500 });
  }
}
