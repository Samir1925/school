export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === 'POST') {
    const { email, password } = await request.json();
    const { results } = await env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).all();
    if (results.length && results[0].password === password) { // In production use hashed comparison
      const token = btoa(JSON.stringify({ id: results[0].id, role: results[0].role, exp: Date.now()+86400000 }));
      return new Response(JSON.stringify({ token }), { headers: { 'Content-Type': 'application/json' } });
    }
    return new Response(JSON.stringify({ error: 'Invalid' }), { status: 401 });
  }
  return new Response('Method not allowed', { status: 405 });
}
