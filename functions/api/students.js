export async function onRequest(context) {
  const { request, env } = context;
  const db = env.DB;
  if (request.method === 'GET') {
    const { results } = await db.prepare('SELECT * FROM students').all();
    return new Response(JSON.stringify(results), { headers: { 'Content-Type': 'application/json' } });
  }
  if (request.method === 'POST') {
    const { name, grade, parent_name, email } = await request.json();
    await db.prepare('INSERT INTO students (name, grade, parent_name, email) VALUES (?, ?, ?, ?)').bind(name, grade, parent_name, email).run();
    return new Response(JSON.stringify({ success: true }), { status: 201 });
  }
  // ... similar for PUT/DELETE
}
