import { NextResponse } from "next/server";
import { withMetrics } from "@/lib/with-metrics";
// src/app/api/v1/external-api/route.ts
export async function GEThandler() {
    try {
      // No timeout handling
      const response = await fetch('https://jsonplaceholder.typicode.com/posts');
      const data = await response.json();
      
      // No error checking for response status
      return NextResponse.json(data);
    } catch (error) {
      return NextResponse.json({ error: 'External API error' }, { status: 500 });
    }
  }
  
export const GET = withMetrics(GEThandler);