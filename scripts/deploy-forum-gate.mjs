import { readFile, readdir, appendFile } from 'node:fs/promises';
import { join } from 'node:path';

const token=process.env.VERCEL_TOKEN,teamId=process.env.VERCEL_ORG_ID;
const projectName='bitcoinpark-forum-gate';
if(!token||!teamId)throw new Error('Vercel deployment credentials are missing.');
for(const key of ['FORUM_PASSWORD_VERIFIER','FORUM_SESSION_SECRET','FORUM_CATALOG_KEY'])if(!process.env[key])throw new Error(`Missing ${key}.`);
async function api(path,options={}){
 const url=new URL(path,'https://api.vercel.com');if(teamId.startsWith('team_'))url.searchParams.set('teamId',teamId);
 const response=await fetch(url,{...options,headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json',...options.headers}});
 const data=await response.json();
 if(!response.ok){let reason=String(data.error?.message||'No details supplied.');for(const value of [token,teamId,...Object.entries(process.env).filter(([k])=>k.startsWith('FORUM_')).map(([,v])=>v)])if(value)reason=reason.replaceAll(value,'[redacted]');const error=new Error(`Vercel request failed for ${url.pathname} (${response.status}, ${data.error?.code||'unknown'}): ${reason}`);error.status=response.status;throw error;}
 return data;
}
await api('/v2/user');
console.log('Vercel authentication confirmed.');
let project;
try{project=await api(`/v9/projects/${projectName}`);}catch(error){
 if(error.status!==404)throw error;
 project=await api('/v11/projects',{method:'POST',body:JSON.stringify({name:projectName,framework:null,nodeVersion:'22.x'})});
}
if(project.name!==projectName)throw new Error('Unexpected project; stopping.');
const entries=['FORUM_PASSWORD_VERIFIER','FORUM_SESSION_SECRET','FORUM_CATALOG_KEY'].map(key=>({key,value:process.env[key],type:'encrypted',target:['production']}));
const saved=await api(`/v10/projects/${project.id}/env?upsert=true`,{method:'POST',body:JSON.stringify(entries)});
if(saved.failed?.length)throw new Error('Some Forum runtime secrets could not be configured.');
const files=[];
async function collect(directory,relative=''){
 for(const entry of await readdir(directory,{withFileTypes:true})){
  if(['tests','tools','README.md','.local'].includes(entry.name)||entry.name.startsWith('.'))continue;
  const child=join(directory,entry.name),name=relative+entry.name;
  if(entry.isDirectory())await collect(child,name+'/');
  else files.push({file:name,data:(await readFile(child)).toString('base64'),encoding:'base64'});
 }
}
await collect('_forum-gate');
let deployment=await api('/v13/deployments',{method:'POST',body:JSON.stringify({name:projectName,project:project.id,target:'production',files,projectSettings:{framework:null,nodeVersion:'22.x'},meta:{githubCommitSha:process.env.GITHUB_SHA||'manual'}})});
console.log(`Forum service deployment created: ${deployment.id}`);
for(let attempt=0;attempt<90;attempt++){
 deployment=await api(`/v13/deployments/${deployment.id}`);
 if(deployment.readyState==='READY')break;
 if(['ERROR','CANCELED'].includes(deployment.readyState))throw new Error(`Forum deployment ${deployment.readyState}.`);
 await new Promise(resolve=>setTimeout(resolve,5000));
}
if(deployment.readyState!=='READY')throw new Error('Forum deployment did not finish in time.');
const aliases=deployment.alias||[];
const host=aliases.find(value=>value===projectName+'.vercel.app')||aliases.find(value=>value.endsWith('.vercel.app'))||deployment.url;
if(!host||!host.endsWith('.vercel.app'))throw new Error('No production service URL returned.');
const endpoint=`https://${host}/api/access`;
const unauth=await fetch(endpoint,{headers:{Origin:'https://bitcoinpark.com'}});
if(unauth.status!==401)throw new Error(`Expected a password gate, received ${unauth.status}.`);
console.log(`FORUM_ACCESS_ENDPOINT=${endpoint}`);
if(process.env.GITHUB_STEP_SUMMARY)await appendFile(process.env.GITHUB_STEP_SUMMARY,`Forum catalog service is ready.\n\nEndpoint: ${endpoint}\n\nUnauthenticated requests return 401.\n`);
