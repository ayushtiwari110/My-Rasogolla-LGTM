// src/app/api/v1/memory-leak/route.ts
import { withMetrics } from '@/lib/with-metrics';
import { NextResponse } from 'next/server';
// Global variable to simulate memory leak
const storedData: any[] = [];

export async function GEThandler() {
  try {
    // Create large objects and store them without cleanup
    for (let i = 0; i < 1000; i++) {
      storedData.push({
        id: crypto.randomUUID(),
        data: new Array(10000).fill('x').join(''),
        timestamp: new Date()
      });
    }
    
    return NextResponse.json({ 
      message: 'Operation completed',
      storedItems: storedData.length
    });
  } catch (error) {
    return NextResponse.json({ error: 'Operation failed' }, { status: 500 });
  }
}

export const GET = withMetrics(GEThandler);