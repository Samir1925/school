export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === 'POST') {
    const { name, email, message } = await request.json();
    // Here you could integrate with a mail service like SendGrid
    // env.SENDGRID_API_KEY ...
    console.log('Contact form submission:', { name, email, message });
    return new Response(JSON.stringify({ success: 'Message received' }), { status: 201 });
  }
}
