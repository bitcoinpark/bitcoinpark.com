import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes, scryptSync } from 'node:crypto';
import { handler } from '../index.mjs';
const password = randomBytes(24).toString('base64url'), salt = randomBytes(16);
process.env.FORUM_PASSWORD_VERIFIER = `${salt.toString('base64url')}:${scryptSync(password, salt, 32).toString('base64url')}`;
process.env.FORUM_SESSION_SECRET = randomBytes(32).toString('base64url');
process.env.FORUM_CATALOG_KEY = randomBytes(32).toString('base64url');
function event(body, extra = {}) {
  return { rawPath: '/api/access', headers: { origin: 'https://bitcoinpark.com', 'content-type': 'application/json', ...extra }, requestContext: { http: { method: 'POST', sourceIp: '192.0.2.20' } }, body: JSON.stringify(body) };
}
test('Lambda adapter supports encoded requests and enforces actual body size', async () => {
  const request = event({ password });
  const response = await handler({ ...request, isBase64Encoded: true, body: Buffer.from(request.body).toString('base64') });
  assert.equal(response.statusCode, 200);
  assert.equal(response.headers['Access-Control-Allow-Origin'], 'https://bitcoinpark.com');
  assert.ok(JSON.parse(response.body).token);
  assert.equal((await handler(event({ password: 'x'.repeat(2048) }, { 'content-length': '1' }))).statusCode, 413);
  assert.equal((await handler({ ...event({}), body: '{' })).statusCode, 400);
  assert.equal((await handler({ ...event({}), rawPath: '/private/catalog.enc.json' })).statusCode, 404);
});
test('spoofed forwarding headers cannot bypass the per-instance attempt limit', async () => {
  for (let i = 0; i < 8; i++) assert.equal((await handler(event({ password: 'wrong' }, { 'x-real-ip': `spoof-${i}`, 'x-forwarded-for': `other-${i}` }))).statusCode, 401);
  assert.equal((await handler(event({ password }, { 'x-real-ip': 'new-spoof' }))).statusCode, 429);
});
