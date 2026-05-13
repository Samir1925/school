import { SignJWT, jwtVerify } from 'jose';

function uid() {
  return crypto.randomUUID();
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const method = request.method;
    const path = url.pathname.replace('/api', '');
    const secret = new TextEncoder().encode(env.JWT_SECRET || 'default-secret-change-me');

    // CORS headers
    const headers = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Authorization, Content-Type',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    };

    if (method === 'OPTIONS') {
      return new Response(null, { status: 204, headers });
    }

    // Helper: create JWT
    async function createToken(user) {
      return await new SignJWT(user)
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('24h')
        .sign(secret);
    }

    // Helper: verify JWT
    async function verifyToken(req) {
      const auth = req.headers.get('Authorization');
      if (!auth || !auth.startsWith('Bearer ')) throw new Error('Missing token');
      const token = auth.split(' ')[1];
      const { payload } = await jwtVerify(token, secret);
      return payload;
    }

    // ---------- LOGIN (public) ----------
    if (path === '/login' && method === 'POST') {
      try {
        const { email, password } = await request.json();
        if (email === env.ADMIN_EMAIL && password === env.ADMIN_PASSWORD) {
          const token = await createToken({ role: 'admin' });
          return new Response(JSON.stringify({ token }), { headers });
        }
        return new Response(JSON.stringify({ error: 'Invalid credentials' }), { status: 401, headers });
      } catch {
        return new Response(JSON.stringify({ error: 'Bad request' }), { status: 400, headers });
      }
    }

    // ---------- All other routes require auth ----------
    try {
      await verifyToken(request);
    } catch {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers });
    }

    const db = env.DB;   // D1 binding

    // ---------- DASHBOARD ----------
    if (path === '/dashboard' && method === 'GET') {
      const [stu, tea, not, adm] = await Promise.all([
        db.prepare(`SELECT COUNT(*) as c FROM students`).first(),
        db.prepare(`SELECT COUNT(*) as c FROM teachers`).first(),
        db.prepare(`SELECT COUNT(*) as c FROM notices`).first(),
        db.prepare(`SELECT COUNT(*) as c FROM admissions`).first(),
      ]);
      return new Response(JSON.stringify({
        students: stu.c,
        teachers: tea.c,
        notices: not.c,
        admissions: adm.c
      }), { headers });
    }

    // ---------- NOTICES ----------
    if (path === '/notices') {
      if (method === 'GET') {
        const { results } = await db.prepare(`SELECT * FROM notices ORDER BY date DESC`).all();
        return new Response(JSON.stringify(results), { headers });
      }
      if (method === 'POST') {
        const { title, content, date } = await request.json();
        const id = uid();
        await db.prepare(`INSERT INTO notices (id, title, content, date) VALUES (?, ?, ?, ?)`).bind(id, title, content, date).run();
        return new Response(JSON.stringify({ id, title, content, date }), { status: 201, headers });
      }
      if (method === 'PUT') {
        const { id, title, content, date } = await request.json();
        await db.prepare(`UPDATE notices SET title=?, content=?, date=? WHERE id=?`).bind(title, content, date, id).run();
        return new Response(JSON.stringify({ ok: true }), { headers });
      }
    }
    if (path.startsWith('/notices/') && method === 'DELETE') {
      const id = path.split('/')[2];
      await db.prepare(`DELETE FROM notices WHERE id=?`).bind(id).run();
      return new Response(JSON.stringify({ ok: true }), { headers });
    }

    // ---------- NEWS ----------
    if (path === '/news') {
      if (method === 'GET') {
        const { results } = await db.prepare(`SELECT * FROM news ORDER BY date DESC`).all();
        return new Response(JSON.stringify(results), { headers });
      }
      if (method === 'POST') {
        const { title, summary, content, date, image } = await request.json();
        const id = uid();
        await db.prepare(`INSERT INTO news (id, title, summary, content, date, image) VALUES (?,?,?,?,?,?)`)
          .bind(id, title, summary, content, date, image || '').run();
        return new Response(JSON.stringify({ id }), { status: 201, headers });
      }
      if (method === 'PUT') {
        const { id, title, summary, content, date, image } = await request.json();
        await db.prepare(`UPDATE news SET title=?, summary=?, content=?, date=?, image=? WHERE id=?`)
          .bind(title, summary, content, date, image, id).run();
        return new Response(JSON.stringify({ ok: true }), { headers });
      }
    }
    if (path.startsWith('/news/') && method === 'DELETE') {
      const id = path.split('/')[2];
      await db.prepare(`DELETE FROM news WHERE id=?`).bind(id).run();
      return new Response(JSON.stringify({ ok: true }), { headers });
    }

    // ---------- GALLERY ----------
    if (path === '/gallery') {
      if (method === 'GET') {
        const { results } = await db.prepare(`SELECT * FROM gallery ORDER BY created_at DESC`).all();
        return new Response(JSON.stringify(results), { headers });
      }
      if (method === 'POST') {
        const { url, alt, category } = await request.json();
        const id = uid();
        await db.prepare(`INSERT INTO gallery (id, url, alt, category) VALUES (?,?,?,?)`)
          .bind(id, url, alt, category).run();
        return new Response(JSON.stringify({ id, url, alt, category }), { status: 201, headers });
      }
    }
    if (path.startsWith('/gallery/') && method === 'DELETE') {
      const id = path.split('/')[2];
      await db.prepare(`DELETE FROM gallery WHERE id=?`).bind(id).run();
      return new Response(JSON.stringify({ ok: true }), { headers });
    }

    // ---------- TEACHERS ----------
    if (path === '/teachers') {
      if (method === 'GET') {
        const { results } = await db.prepare(`SELECT * FROM teachers ORDER BY name`).all();
        return new Response(JSON.stringify(results), { headers });
      }
      if (method === 'POST') {
        const { name, subject, email } = await request.json();
        const id = uid();
        await db.prepare(`INSERT INTO teachers (id, name, subject, email) VALUES (?,?,?,?)`)
          .bind(id, name, subject, email).run();
        return new Response(JSON.stringify({ id }), { status: 201, headers });
      }
      // PUT and DELETE similar...
    }

    // ---------- STUDENTS ----------
    if (path === '/students') {
      if (method === 'GET') {
        const { results } = await db.prepare(`SELECT * FROM students ORDER BY name`).all();
        return new Response(JSON.stringify(results), { headers });
      }
      if (method === 'POST') {
        const { name, grade, parent_name } = await request.json();
        const id = uid();
        await db.prepare(`INSERT INTO students (id, name, grade, parent_name) VALUES (?,?,?,?)`)
          .bind(id, name, grade, parent_name).run();
        return new Response(JSON.stringify({ id }), { status: 201, headers });
      }
    }

    // ---------- ADMISSIONS ----------
    if (path === '/admissions') {
      if (method === 'GET') {
        const { results } = await db.prepare(`SELECT * FROM admissions ORDER BY submitted_at DESC`).all();
        return new Response(JSON.stringify(results), { headers });
      }
      if (method === 'POST') {
        const { student_name, parent_name, grade, email } = await request.json();
        const id = uid();
        await db.prepare(`INSERT INTO admissions (id, student_name, parent_name, grade, email) VALUES (?,?,?,?,?)`)
          .bind(id, student_name, parent_name, grade, email).run();
        return new Response(JSON.stringify({ id }), { status: 201, headers });
      }
    }
    if (path.startsWith('/admissions/') && method === 'DELETE') {
      const id = path.split('/')[2];
      await db.prepare(`DELETE FROM admissions WHERE id=?`).bind(id).run();
      return new Response(JSON.stringify({ ok: true }), { headers });
    }

    // Fallback
    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers });
  }
};
