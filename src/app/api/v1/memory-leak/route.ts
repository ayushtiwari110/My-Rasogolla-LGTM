// src/app/api/v1/memory-leak/route.ts
// Global variable to simulate memory leak
const storedData: any[] = [];

export async function GET() {
  try {
    // Create large objects and store them without cleanup
    for (let i = 0; i < 1000; i++) {
      storedData.push({
        id: crypto.randomUUID(),
        data: new Array(10000).fill('x').join(''),
        timestamp: new Date()
      });
    }
    
    return Response.json({ 
      message: 'Operation completed',
      storedItems: storedData.length
    });
  } catch (error) {
    return Response.json({ error: 'Operation failed' }, { status: 500 });
  }
}
