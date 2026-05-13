export async function onRequest(context) {
  const { request, env } = context;
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
  if (request.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const url = new URL(request.url);
  const limit = url.searchParams.get('limit') || 10;
  const db = env.DB; // D1 binding

  if (request.method === 'GET') {
    const { results } = await db.prepare('SELECT * FROM notices ORDER BY created_at DESC LIMIT ?').bind(limit).all();
    return new Response(JSON.stringify(results), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  if (request.method === 'POST') {
    const auth = request.headers.get('Authorization');
    if (auth !== 'Bearer admin-secret') return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    const { title, description, date } = await request.json();
    await db.prepare('INSERT INTO notices (title, description, date) VALUES (?, ?, ?)').bind(title, description, date).run();
    return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
  }
  return new Response('Method not allowed', { status: 405, headers: corsHeaders });
}
