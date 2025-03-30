// src/app/api/v1/cpu-intensive/route.ts
export async function GET() {
    try {
      // CPU-intensive operation with no optimization
      let result = 0;
      for (let i = 0; i < 10000000; i++) {
        result += Math.sqrt(i) * Math.random();
      }
      
      return Response.json({ result });
    } catch (error) {
      return Response.json({ error: 'Calculation failed' }, { status: 500 });
    }
  }
  