export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname.replace('/api', '');
  const method = request.method;

  // CORS headers
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };

  if (method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  // Only handle login for now
  if (path === '/login' && method === 'POST') {
    try {
      const { email, password } = await request.json();
      const adminEmail = env.ADMIN_EMAIL || 'admin@school.edu.np';
      const adminPass = env.ADMIN_PASSWORD || 'password';
      if (email === adminEmail && password === adminPass) {
        // Simple token generation (no jose needed for test – use a dummy token)
        const token = btoa(JSON.stringify({ role: 'admin', exp: Date.now() + 86400000 }));
        return new Response(JSON.stringify({ token }), { headers });
      } else {
        return new Response(JSON.stringify({ error: 'Invalid credentials' }), { status: 401, headers });
      }
    } catch (e) {
      return new Response(JSON.stringify({ error: 'Bad request' }), { status: 400, headers });
    }
  }

  // If not login, return 404
  return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers });
}
