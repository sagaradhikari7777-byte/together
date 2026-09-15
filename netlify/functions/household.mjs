import household, { makeHandler } from '../../api/household.js';
import { storage } from '../../lib/netlify-storage.js';

export const config = { path: '/api/household' };

export function adapt(handler) {
  return async (request, context = {}) => {
    const headers = new Headers({ 'Cache-Control': 'no-store', 'Content-Type': 'application/json' });
    if (request.method !== 'POST') return new Response(JSON.stringify({ error: 'Method not allowed.' }), { status: 405, headers });
    const reader = request.body?.getReader();
    let size = 0;
    const chunks = [];
    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > 500000) {
          await reader.cancel();
          return new Response(JSON.stringify({ error: 'Request too large.' }), { status: 413, headers });
        }
        chunks.push(value);
      }
    }
    let body;
    try { body = JSON.parse(Buffer.concat(chunks).toString('utf8')); }
    catch { return new Response(JSON.stringify({ error: 'Invalid JSON.' }), { status: 400, headers }); }
    const reqHeaders = Object.fromEntries(request.headers);
    reqHeaders.host = new URL(request.url).host;
    // Netlify supplies the client IP; do not trust a caller-supplied forwarding header.
    reqHeaders['x-forwarded-for'] = context.ip || 'unknown';
    let status = 200;
    let payload;
    const res = {
      setHeader(name, value) { headers.set(name, value); },
      status(code) { status = code; return this; },
      json(value) { payload = value; return this; },
    };
    await handler({ method: request.method, headers: reqHeaders, body }, res);
    return new Response(JSON.stringify(payload), { status, headers });
  };
}

export default adapt((req, res) => {
  const hasRedis = (process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL)
    && (process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN);
  return (hasRedis ? household : makeHandler(storage))(req, res);
});
