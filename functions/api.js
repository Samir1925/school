// Cloudflare Pages Function (or Worker) – place in /functions/api.js
// For demonstration, using a simple in-memory store and JWT-like token.
// In production, use KV, D1, or Supabase.

export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const path = url.pathname.replace('/api', '');

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
  };

  // Handle preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers });
  }

  // Public endpoints
  if (path === '/login' && request.method === 'POST') {
    const { email, password } = await request.json();
    // Simple demo check (replace with real auth)
    if (email === 'admin@school.edu.np' && password === 'admin123') {
      const token = btoa(JSON.stringify({ role: 'admin', exp: Date.now()+86400000 }));
      return new Response(JSON.stringify({ token }), { headers });
    }
    return new Response(JSON.stringify({ error: 'Invalid credentials' }), { status: 401, headers });
  }

  // Protected endpoints
  const auth = request.headers.get('Authorization');
  if (!auth || !auth.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers });
  }
  // Token verification simplified
  try {
    const payload = JSON.parse(atob(auth.split(' ')[1]));
    if (payload.exp < Date.now()) throw new Error('expired');
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 403, headers });
  }

  // Dashboard data
  if (path === '/dashboard' && request.method === 'GET') {
    const data = { students: 1500, teachers: 75, notices: 3 };
    return new Response(JSON.stringify(data), { headers });
  }

  // Notices CRUD (simplified)
  // ... additional logic for /notices GET, POST, DELETE, etc.

  return new Response(JSON.stringify({ message: 'API endpoint' }), { headers });
}
