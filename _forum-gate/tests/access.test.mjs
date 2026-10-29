import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes, scryptSync, createCipheriv } from 'node:crypto';
import { passwordMatches, signSession, verifySession, decryptCatalog } from '../lib/access.mjs';
import handler from '../api/access.mjs';

const salt = randomBytes(16).toString('base64url');
const password = randomBytes(24).toString('base64url');
const verifier = `${salt}:${scryptSync(password, Buffer.from(salt,'base64url'),32).toString('base64url')}`;
const secret = randomBytes(32).toString('base64url');
process.env.FORUM_PASSWORD_VERIFIER=verifier;
process.env.FORUM_SESSION_SECRET=secret;
process.env.FORUM_CATALOG_KEY=randomBytes(32).toString('base64url');
async function call(method, body, headers={}) {
 const req={method,body,headers:{origin:'https://bitcoinpark.com','content-type':'application/json','x-real-ip':'unit-test',...headers}};
 const result={headers:{}};
 const res={statusCode:200,setHeader:(k,v)=>result.headers[k]=v,end:value=>{result.status=res.statusCode;result.body=value?JSON.parse(value):null;}};
 await handler(req,res);return result;
}
test('password verification and signed sessions reject bypasses and expiration',()=>{
 assert.ok(passwordMatches(password,verifier));assert.equal(passwordMatches('wrong',verifier),false);
 assert.equal(passwordMatches('x'.repeat(129),verifier),false);
 const session=signSession(secret,1000000);assert.ok(verifySession(session.token,secret,1000000));
 assert.equal(verifySession(session.token,secret,4600000),false);
 assert.equal(verifySession(session.token+'x',secret,1000000),false);
 assert.equal(verifySession('true',secret),false);
 assert.equal(verifySession(session.token,randomBytes(32).toString('hex'),1000000),false);
});
test('catalog encryption rejects a wrong key and tampered content',()=>{
 const key=randomBytes(32),iv=randomBytes(12);const cipher=createCipheriv('aes-256-gcm',key,iv);
 const data=Buffer.concat([cipher.update(JSON.stringify({ideas:[{title:'Private test idea'}]})),cipher.final()]);
 const envelope={version:1,iv:iv.toString('base64url'),tag:cipher.getAuthTag().toString('base64url'),data:data.toString('base64url')};
 assert.equal(decryptCatalog(envelope,key.toString('base64url')).ideas[0].title,'Private test idea');
 assert.throws(()=>decryptCatalog(envelope,randomBytes(32).toString('base64url')));
 assert.throws(()=>decryptCatalog({...envelope,tag:randomBytes(16).toString('base64url')},key.toString('base64url')));
});
test('direct requests, wrong passwords, and foreign origins cannot access the catalog',async()=>{
 assert.equal((await call('GET')).status,401);
 assert.equal((await call('GET',null,{authorization:'Bearer true'})).status,401);
 assert.equal((await call('POST',{password:'wrong'})).status,401);
 assert.equal((await call('POST',{password},{origin:'https://example.invalid'})).status,403);
 assert.equal((await call('GET',null,{origin:undefined})).status,403);
 const login=await call('POST',{password});assert.equal(login.status,200);
 assert.ok(verifySession(login.body.token,secret));
 assert.equal(login.headers['Cache-Control'],'private, no-store, max-age=0');
 assert.equal((await call('OPTIONS')).status,204);
 assert.equal((await call('DELETE')).status,405);
});
test('repeated wrong passwords are throttled and missing configuration fails closed',async()=>{
 for(let i=0;i<8;i++)assert.equal((await call('POST',{password:'wrong'},{'x-real-ip':'rate-test'})).status,401);
 assert.equal((await call('POST',{password},{'x-real-ip':'rate-test'})).status,429);
 const saved=process.env.FORUM_CATALOG_KEY;delete process.env.FORUM_CATALOG_KEY;
 assert.equal((await call('POST',{password})).status,503);process.env.FORUM_CATALOG_KEY=saved;
});
