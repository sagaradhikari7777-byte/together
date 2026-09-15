import test from 'node:test';
import assert from 'node:assert/strict';
import { adapt, config } from '../netlify/functions/household.mjs';
import { makeHandler } from '../api/household.js';

test('Netlify maps request, auth, trusted IP and response at the existing API route', async () => {
  const handler = adapt(async (req, res) => {
    assert.equal(req.body.action, 'read');
    assert.equal(req.headers.authorization, 'Bearer private-key');
    assert.equal(req.headers.host, 'together.netlify.app');
    assert.equal(req.headers['x-forwarded-for'], '192.0.2.1');
    res.setHeader('Cache-Control', 'no-store');
    res.status(409).json({ error: 'Conflict' });
  });
  const response = await handler(new Request('https://together.netlify.app/api/household', {
    method: 'POST', headers: { authorization: 'Bearer private-key', 'x-forwarded-for': 'fake' }, body: '{"action":"read"}',
  }), { ip: '192.0.2.1' });
  assert.equal(config.path, '/api/household');
  assert.equal(response.status, 409);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.deepEqual(await response.json(), { error: 'Conflict' });
});

test('Netlify rejects malformed, oversized and non-POST requests before database access', async () => {
  const handler = adapt(() => { throw new Error('Must not reach database'); });
  assert.equal((await handler(new Request('https://example.com/api/household'))).status, 405);
  assert.equal((await handler(new Request('https://example.com/api/household', { method: 'POST', body: '{' }))).status, 400);
  assert.equal((await handler(new Request('https://example.com/api/household', { method: 'POST', body: 'x'.repeat(500001) }))).status, 413);
});

test('Netlify adapter retains server-side cross-origin protection', async () => {
  const handler = adapt(makeHandler(() => { throw new Error('Must not reach database'); }));
  const response = await handler(new Request('https://together.netlify.app/api/household', {
    method: 'POST', headers: { origin: 'https://untrusted.example' }, body: '{"action":"create"}',
  }));
  assert.equal(response.status, 403);
});
