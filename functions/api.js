// ============================================================
// G Star School – Cloudflare Pages Function (API)
// Works with D1 (database) and R2 (file storage)
// ============================================================
import { SignJWT, jwtVerify } from 'jose';

// Helper: create JWT
async function createToken(payload, secret) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('24h')
    .sign(new TextEncoder().encode(secret));
}

// Helper: verify JWT
async function verifyToken(request, secret) {
  const auth = request.headers.get('Authorization');
  if (!auth || !auth.startsWith('Bearer ')) throw new Error('Missing token');
  const token = auth.split(' ')[1];
  const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
  return payload;
}

// Helper: UUID
function uid() {
  return crypto.randomUUID();
}

export async function onRequest(context) {
  const { request, env } = context;   // env.DB = D1, env.GALLERY = R2
  const { method } = request;
  const url = new URL(request.url);
  const path = url.pathname.replace('/api', '');
  const secret = env.JWT_SECRET || 'dev-secret-change-me';

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

  // ---------- PUBLIC: Login ----------
  if (path === '/login' && method === 'POST') {
    try {
      const { email, password } = await request.json();
      if (email === env.ADMIN_EMAIL && password === env.ADMIN_PASSWORD) {
        const token = await createToken({ role: 'admin' }, secret);
        return new Response(JSON.stringify({ token }), { headers });
      }
      return new Response(JSON.stringify({ error: 'Invalid credentials' }), { status: 401, headers });
    } catch {
      return new Response(JSON.stringify({ error: 'Bad request' }), { status: 400, headers });
    }
  }

  // ---------- All other routes require auth ----------
  let user;
  try {
    user = await verifyToken(request, secret);
  } catch {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers });
  }

  const db = env.DB;   // D1 binding
  const bucket = env.GALLERY; // R2 binding

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

  // ---------- NEWS (identical pattern) ----------
  if (path === '/news') {
    if (method === 'GET') {
      const { results } = await db.prepare(`SELECT * FROM news ORDER BY date DESC`).all();
      return new Response(JSON.stringify(results), { headers });
    }
    if (method === 'POST') {
      const { title, summary, content, date, image } = await request.json();
      const id = uid();
      await db.prepare(`INSERT INTO news (id, title, summary, content, date, image) VALUES (?,?,?,?,?,?)`).bind(id, title, summary, content, date, image || '').run();
      return new Response(JSON.stringify({ id }), { status: 201, headers });
    }
    if (method === 'PUT') {
      const { id, title, summary, content, date, image } = await request.json();
      await db.prepare(`UPDATE news SET title=?, summary=?, content=?, date=?, image=? WHERE id=?`).bind(title, summary, content, date, image || '', id).run();
      return new Response(JSON.stringify({ ok: true }), { headers });
    }
  }
  if (path.startsWith('/news/') && method === 'DELETE') {
    const id = path.split('/')[2];
    await db.prepare(`DELETE FROM news WHERE id=?`).bind(id).run();
    return new Response(JSON.stringify({ ok: true }), { headers });
  }

  // ---------- GALLERY (R2) ----------
  if (path === '/gallery') {
    if (method === 'GET') {
      const { results } = await db.prepare(`SELECT * FROM gallery ORDER BY created_at DESC`).all();
      return new Response(JSON.stringify(results), { headers });
    }
    if (method === 'POST') {
      const formData = await request.formData();
      const file = formData.get('file');
      if (!file) return new Response(JSON.stringify({ error: 'No file' }), { status: 400, headers });
      const alt = formData.get('alt') || '';
      const category = formData.get('category') || 'campus';
      const key = `${uid()}-${file.name}`;
      await bucket.put(key, file.stream(), {
        httpMetadata: { contentType: file.type },
      });
      const url = `/gallery/${key}`; // or use custom domain for R2
      const id = uid();
      await db.prepare(`INSERT INTO gallery (id, url, alt, category) VALUES (?,?,?,?)`).bind(id, url, alt, category).run();
      return new Response(JSON.stringify({ id, url, alt, category }), { status: 201, headers });
    }
  }
  if (path.startsWith('/gallery/') && method === 'DELETE') {
    const id = path.split('/')[2];
    const row = await db.prepare(`SELECT url FROM gallery WHERE id=?`).bind(id).first();
    if (row) {
      const key = row.url.replace('/gallery/', '');
      try { await bucket.delete(key); } catch {}
    }
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
      await db.prepare(`INSERT INTO teachers (id, name, subject, email) VALUES (?,?,?,?)`).bind(id, name, subject, email).run();
      return new Response(JSON.stringify({ id }), { status: 201, headers });
    }
    if (method === 'PUT') {
      const { id, name, subject, email } = await request.json();
      await db.prepare(`UPDATE teachers SET name=?, subject=?, email=? WHERE id=?`).bind(name, subject, email, id).run();
      return new Response(JSON.stringify({ ok: true }), { headers });
    }
  }
  if (path.startsWith('/teachers/') && method === 'DELETE') {
    const id = path.split('/')[2];
    await db.prepare(`DELETE FROM teachers WHERE id=?`).bind(id).run();
    return new Response(JSON.stringify({ ok: true }), { headers });
  }

  // ---------- STUDENTS ----------
  if (path === '/students') {
    if (method === 'GET') {
      const { results } = await db.prepare(`SELECT * FROM students ORDER BY name`).all();
      return new Response(JSON.stringify(results), { headers });
    }
    if (method === 'POST') {
      const { name, grade, parentName } = await request.json();
      const id = uid();
      await db.prepare(`INSERT INTO students (id, name, grade, parent_name) VALUES (?,?,?,?)`).bind(id, name, grade, parentName).run();
      return new Response(JSON.stringify({ id }), { status: 201, headers });
    }
    // PUT & DELETE similar...
  }

  // ---------- ADMISSIONS (public can submit, admin can view/delete) ----------
  if (path === '/admissions') {
    if (method === 'GET') {
      const { results } = await db.prepare(`SELECT * FROM admissions ORDER BY submitted_at DESC`).all();
      return new Response(JSON.stringify(results), { headers });
    }
    if (method === 'POST') {
      const { studentName, parentName, grade, email } = await request.json();
      const id = uid();
      await db.prepare(`INSERT INTO admissions (id, student_name, parent_name, grade, email) VALUES (?,?,?,?,?)`).bind(id, studentName, parentName, grade, email).run();
      return new Response(JSON.stringify({ id }), { status: 201, headers });
    }
  }
  if (path.startsWith('/admissions/') && method === 'DELETE') {
    const id = path.split('/')[2];
    await db.prepare(`DELETE FROM admissions WHERE id=?`).bind(id).run();
    return new Response(JSON.stringify({ ok: true }), { headers });
  }

  return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers });
}
