// src/app/api/v1/external-api/route.ts
export async function GET() {
    try {
      // No timeout handling
      const response = await fetch('https://jsonplaceholder.typicode.com/posts');
      const data = await response.json();
      
      // No error checking for response status
      return Response.json(data);
    } catch (error) {
      return Response.json({ error: 'External API error' }, { status: 500 });
    }
  }
  