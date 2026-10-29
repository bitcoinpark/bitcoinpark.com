import { createHmac, timingSafeEqual, scryptSync, randomBytes, createDecipheriv } from 'node:crypto';

export const sessionSeconds = 60 * 60;
export const allowedOrigins = new Set(['https://bitcoinpark.com', 'https://www.bitcoinpark.com']);
export function sameSecret(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const aa = Buffer.from(a), bb = Buffer.from(b);
  return aa.length === bb.length && timingSafeEqual(aa, bb);
}
export function passwordMatches(input, verifier) {
  if (typeof input !== 'string' || input.length > 128 || !verifier) return false;
  const [salt, expected] = verifier.split(':');
  if (!salt || !expected) return false;
  const actual = scryptSync(input, Buffer.from(salt, 'base64url'), 32).toString('base64url');
  return sameSecret(actual, expected);
}
export function signSession(secret, now = Date.now()) {
  const expiresAt = Math.floor(now / 1000) + sessionSeconds;
  const payload = Buffer.from(JSON.stringify({ aud: 'park-forum-catalog', exp: expiresAt, nonce: randomBytes(16).toString('base64url') })).toString('base64url');
  const signature = createHmac('sha256', secret).update(payload).digest('base64url');
  return { token: `${payload}.${signature}`, expiresAt };
}
export function verifySession(token, secret, now = Date.now()) {
  if (typeof token !== 'string' || token.length > 1024 || !secret) return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [payload, signature] = parts;
  if (!sameSecret(signature, createHmac('sha256', secret).update(payload).digest('base64url'))) return false;
  try {
    const value = JSON.parse(Buffer.from(payload, 'base64url'));
    const seconds = Math.floor(now / 1000);
    return value.aud === 'park-forum-catalog' && Number.isInteger(value.exp) && value.exp > seconds && value.exp <= seconds + sessionSeconds;
  } catch { return false; }
}
export function decryptCatalog(envelope, key) {
  if (envelope.version !== 1) throw new Error('Unsupported catalog format.');
  const decipher = createDecipheriv('aes-256-gcm', Buffer.from(key, 'base64url'), Buffer.from(envelope.iv, 'base64url'));
  decipher.setAuthTag(Buffer.from(envelope.tag, 'base64url'));
  return JSON.parse(Buffer.concat([decipher.update(Buffer.from(envelope.data, 'base64url')), decipher.final()]).toString('utf8'));
}
