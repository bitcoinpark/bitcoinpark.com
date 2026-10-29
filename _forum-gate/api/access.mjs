import { readFile } from 'node:fs/promises';
import { allowedOrigins, passwordMatches, signSession, verifySession, decryptCatalog } from '../lib/access.mjs';

const failures = new Map();
const windowMs = 15 * 60 * 1000;
function limited(ip) {
  const now = Date.now();
  if (failures.size > 10000) for (const [key, value] of failures) if (value.until <= now) failures.delete(key);
  const entry = failures.get(ip);
  if (entry && entry.until > now) return entry.count >= 8;
  failures.delete(ip); return false;
}
function recordFailure(ip) {
  const entry = failures.get(ip);
  if (entry && entry.until > Date.now()) entry.count++;
  else failures.set(ip, { count: 1, until: Date.now() + windowMs });
}
export default async function handler(req, res) {
  const origin = req.headers.origin;
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
  res.setHeader('Vary', 'Origin');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  const reply = (status, body) => { res.statusCode = status; res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(body)); };
  if (!allowedOrigins.has(origin)) return reply(403, { error: 'Open Park Forum to continue.' });
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') { res.statusCode = 204; return res.end(); }
  if (!process.env.FORUM_PASSWORD_VERIFIER || !process.env.FORUM_SESSION_SECRET || !process.env.FORUM_CATALOG_KEY) return reply(503, { error: 'Sponsor access is temporarily unavailable. Please try again shortly.' });
  if (req.method === 'POST') {
    if (!req.headers['content-type']?.includes('application/json')) return reply(415, { error: 'Use the password form to continue.' });
    if (Number(req.headers['content-length'] || 0) > 1024) return reply(413, { error: 'The password could not be read.' });
    const ip = String(req.headers['x-real-ip'] || req.headers['x-forwarded-for'] || 'unknown').split(',')[0].slice(0,80);
    if (limited(ip)) { res.setHeader('Retry-After', '900'); return reply(429, { error: 'Too many attempts. Please try again in 15 minutes.' }); }
    let body = req.body;
    try { if (typeof body === 'string') body = JSON.parse(body); } catch { return reply(400, { error: 'The password could not be read.' }); }
    if (!passwordMatches(body?.password, process.env.FORUM_PASSWORD_VERIFIER)) {
      recordFailure(ip);
      return reply(401, { error: 'That password doesn’t match. Please try again.' });
    }
    failures.delete(ip);
    return reply(200, signSession(process.env.FORUM_SESSION_SECRET));
  }
  if (req.method !== 'GET') { res.setHeader('Allow', 'GET, POST, OPTIONS'); return reply(405, { error: 'Method not allowed.' }); }
  const token = req.headers.authorization?.replace(/^Bearer /, '');
  if (!verifySession(token, process.env.FORUM_SESSION_SECRET)) return reply(401, { error: 'Enter the sponsor password to explore the catalog.' });
  try {
    const envelope = JSON.parse(await readFile(new URL('../private/catalog.enc.json', import.meta.url), 'utf8'));
    const catalog = decryptCatalog(envelope, process.env.FORUM_CATALOG_KEY);
    const template = await readFile(new URL('../private/catalog-template.html', import.meta.url), 'utf8');
    const json = JSON.stringify(catalog).replace(/</g, '\\u003c');
    const html = template.replace('<!-- FORUM_CATALOG_DATA -->', `<script type="application/json" id="catalog-data">${json}</script>`);
    return reply(200, { html });
  } catch {
    return reply(503, { error: 'The catalog is temporarily unavailable. Please try again.' });
  }
}
