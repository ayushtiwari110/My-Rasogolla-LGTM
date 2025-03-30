// src/app/api/v1/auth/login/route.ts
// Simple in-memory user store (bad practice)
const users = [
    { username: 'test', password: 'password' }
  ];
  
  export async function POST(request: Request) {
    try {
      const { username, password } = await request.json();
      
      // Slow, inefficient search
      let user;
      for (let i = 0; i < users.length; i++) {
        if (users[i].username === username && users[i].password === password) {
          user = users[i];
          break;
        }
      }
      
      if (!user) {
        return Response.json({ error: 'Invalid credentials' }, { status: 401 });
      }
      
      // No token expiration
      const token = 'fake-jwt-token-' + Date.now();
      
      return Response.json({ token });
    } catch (error) {
      return Response.json({ error: 'Login failed' }, { status: 500 });
    }
  }
  