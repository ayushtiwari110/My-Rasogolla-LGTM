// src/lib/with-metrics.ts
import { NextRequest, NextResponse } from 'next/server';
import { updateHttpMetrics } from './update-metrics';

type Handler<T = any> = (
  req: NextRequest,
  context?: T
) => Promise<NextResponse>;

export function withMetrics<T = any>(handler: Handler<T>) {
  return async (req: NextRequest, context?: T) => {
    const start = Date.now();
    let response: NextResponse;
    const url = new URL(req.url);
    
    // Extract route pattern from pathname
    const route = url.pathname
      .replace(/\/(\d+)(?!v\d)/g, '/[id]') // Replace numeric IDs, but don't match version numbers
      .replace(/\/([a-f0-9-]{20,})/g, '/[slug]'); // Replace UUIDs/slugs

    try {
      response = await handler(req, context);
    } catch (error) {
      const duration = Date.now() - start;
      const errorType = error instanceof Error ? error.constructor.name : 'unknown';
      await updateHttpMetrics({
        method: req.method,
        route,
        statusCode: 500,
        userAgent: req.headers.get('user-agent'),
        duration: duration / 1000,
        errorType
      });

      throw error;
    }

    const duration = Date.now() - start;
    let contentLength = 0;

    try {
      const clone = response.clone();
      const text = await clone.text();
      contentLength = text.length;
    } catch (err) {
      console.error('Error calculating content length:', err);
    }

    await updateHttpMetrics({
      method: req.method,
      route,
      statusCode: response.status,
      userAgent: req.headers.get('user-agent'),
      duration: duration / 1000,
      contentLength
    });

    return response;
  };
}
