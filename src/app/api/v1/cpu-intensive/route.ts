// src/app/api/v1/cpu-intensive/route.ts
import { NextResponse } from 'next/server';
import { withMetrics } from '@/lib/with-metrics';

export async function GEThandler() {
    try {
      // CPU-intensive operation with no optimization
      let result = 0;
      for (let i = 0; i < 10000000; i++) {
        result += Math.sqrt(i) * Math.random();
      }
      
      return NextResponse.json({ result });
    } catch (error) {
      return NextResponse.json({ error: 'Calculation failed' }, { status: 500 });
    }
}
  
export const GET = withMetrics(GEThandler);