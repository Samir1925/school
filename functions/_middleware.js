export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  // Protect admin API routes
  if (url.pathname.startsWith('/api/') && !url.pathname.startsWith('/api/auth') && !url.pathname.startsWith('/api/contact') && request.method !== 'GET') {
    const auth = request.headers.get('Authorization');
    if (!auth || !auth.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }
    try {
      const tokenData = JSON.parse(atob(auth.split(' ')[1]));
      if (tokenData.exp < Date.now()) throw new Error('Expired');
      // Attach user info to request for further use if needed
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401 });
    }
  }
  return context.next();
}
