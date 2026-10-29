import { accessEndpoint } from './gate-config.js';
const storageKey = 'park-forum-access-v1';
export function clearAccess() { try { sessionStorage.removeItem(storageKey); } catch {} }
export function savedAccess() {
  try {
    const value = JSON.parse(sessionStorage.getItem(storageKey) || 'null');
    if (typeof value?.token === 'string' && value.token.length <= 1024 && Number.isFinite(value.expiresAt) && value.expiresAt > Date.now()/1000) return value;
  } catch {}
  clearAccess(); return null;
}
async function request(options) {
  if (!accessEndpoint) throw new Error('Sponsor access is being prepared. Please try again shortly.');
  const response = await fetch(accessEndpoint, { ...options, cache: 'no-store', signal: AbortSignal.timeout(15000) });
  let data;
  try { data = await response.json(); } catch { throw new Error('We couldn’t reach the catalog. Please try again.'); }
  if (!response.ok) { const error = new Error(data.error || 'Please try again.'); error.status = response.status; throw error; }
  return data;
}
export async function unlock(password) {
  const session = await request({ method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) });
  if (typeof session.token !== 'string' || !Number.isFinite(session.expiresAt)) throw new Error('Access could not be confirmed. Please try again.');
  try { sessionStorage.setItem(storageKey, JSON.stringify(session)); }
  catch { throw new Error('Allow browser storage to continue to the catalog.'); }
  return session;
}
export async function catalogPage(session) {
  const data = await request({ headers: { Authorization: `Bearer ${session.token}` } });
  if (typeof data.html !== 'string' || !data.html.startsWith('<!doctype html>')) throw new Error('The catalog could not be loaded. Please try again.');
  return data.html;
}
