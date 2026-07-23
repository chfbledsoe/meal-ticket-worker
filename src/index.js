export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // --- Shared ticket storage API, backed by Workers KV ---

    if (url.pathname === '/api/kv' && request.method === 'GET') {
      const key = url.searchParams.get('key');
      if (!key) return new Response('Missing key', { status: 400 });
      const value = await env.TICKETS_KV.get(key);
      if (value === null) return new Response('Not found', { status: 404 });
      return new Response(value, { headers: { 'Content-Type': 'text/plain' } });
    }

    if (url.pathname === '/api/kv' && request.method === 'POST') {
      const body = await request.json();
      if (!body.key) return new Response('Missing key', { status: 400 });
      await env.TICKETS_KV.put(body.key, body.value);
      return new Response('OK');
    }

    if (url.pathname === '/api/kv' && request.method === 'DELETE') {
      const key = url.searchParams.get('key');
      if (!key) return new Response('Missing key', { status: 400 });
      await env.TICKETS_KV.delete(key);
      return new Response('OK');
    }

    if (url.pathname === '/api/kv/list' && request.method === 'GET') {
      const prefix = url.searchParams.get('prefix') || '';
      const list = await env.TICKETS_KV.list({ prefix });
      return new Response(
        JSON.stringify({ keys: list.keys.map(k => k.name) }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    // --- Everything else: serve the static app files as before ---
    const response = await env.ASSETS.fetch(request);
    const newResponse = new Response(response.body, response);
     newResponse.headers.set('Permissions-Policy', 'camera=(self), microphone=()');
    return newResponse;
  }
};
