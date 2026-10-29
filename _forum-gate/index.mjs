import access from './api/access.mjs';

// Lambda Function URL (payload v2). Trust the AWS source IP, never a client header.
export async function handler(event) {
  const headers = Object.fromEntries(Object.entries(event.headers || {}).map(([key, value]) => [key.toLowerCase(), value]));
  const result = { statusCode: 200, headers: {}, body: '', isBase64Encoded: false };
  const res = {
    set statusCode(value) { result.statusCode = value; },
    setHeader(key, value) { result.headers[key] = String(value); },
    end(body = '') { result.body = body; }
  };
  if (event.rawPath !== '/api/access') return { ...result, statusCode: 404, body: 'Not found' };
  const body = Buffer.from(event.body || '', event.isBase64Encoded ? 'base64' : 'utf8');
  headers['content-length'] = String(body.length);
  headers['x-real-ip'] = event.requestContext?.http?.sourceIp || 'unknown';
  delete headers['x-forwarded-for'];
  await access({ method: event.requestContext?.http?.method, headers, body: body.toString('utf8') }, res);
  return result;
}
