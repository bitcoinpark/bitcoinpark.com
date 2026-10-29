// Run locally with authenticated AWS CLI. Never print or put secrets in argv.
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync, mkdtempSync, rmSync } from 'node:fs';
import { randomBytes, scryptSync, createCipheriv } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { decryptCatalog } from '../_forum-gate/lib/access.mjs';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const region = 'us-east-2', account = '155335455111';
const name = 'bitcoinpark-forum-access', roleName = `${name}-role`;
const logGroup = `/aws/lambda/${name}`;
const envelopePath = join(root, '_forum-gate/private/catalog.enc.json');
function aws(service, operation, args = [], input) {
  // This AWS CLI reads input files more than once, so stdin is not reliable.
  // Use an owner-only temporary directory/file and remove it even on failure.
  const requestDir = input ? mkdtempSync(join(tmpdir(), 'forum-aws-request-')) : null;
  const requestFile = requestDir && join(requestDir, 'input.json');
  let result;
  try {
    if (input) writeFileSync(requestFile, JSON.stringify(input), { mode: 0o600 });
    result = spawnSync('aws', [service, operation, '--region', region, '--output', 'json', '--no-cli-pager', ...args,
      ...(input ? ['--cli-input-json', `file://${requestFile}`] : [])], { encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 });
  } finally { if (requestDir) rmSync(requestDir, { recursive: true, force: true }); }
  if (result.status !== 0) {
    // AWS errors can echo request fields. Report only the code, never raw stderr.
    const code = result.stderr?.match(/An error occurred \(([^)]+)\)/)?.[1] || 'CliFailure';
    const error = new Error(`AWS ${service} ${operation} failed (${code}).`); error.code = code; throw error;
  }
  return result.stdout.trim() ? JSON.parse(result.stdout) : {};
}
function optional(service, operation, args, absent) {
  try { return aws(service, operation, args); } catch (error) { if (error.code === absent) return null; throw error; }
}
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
async function waitForFunction() {
  for (let i = 0; i < 45; i++) {
    const config = aws('lambda', 'get-function-configuration', ['--function-name', name]);
    if (config.State === 'Failed' || config.LastUpdateStatus === 'Failed') throw new Error('Lambda update failed. Inspect its status in AWS.');
    if (config.State === 'Active' && config.LastUpdateStatus !== 'InProgress') return;
    await pause(2000);
  }
  throw new Error('Timed out waiting for Lambda to be ready.');
}
async function readPassword() {
  if (!process.stdin.isTTY) throw new Error('Run in a terminal to enter the password securely.');
  process.stdout.write('Enter the Forum password (hidden):\n');
  process.stdin.setRawMode(true); process.stdin.resume();
  return new Promise((resolve, reject) => {
    let value = '';
    function finish(error) {
      process.stdin.off('data', read); process.stdin.setRawMode(false); process.stdin.pause();
      error ? reject(error) : resolve(value);
    }
    function read(chunk) {
      for (const c of chunk.toString()) {
        if (c === '\u0003') return finish(new Error('Canceled.'));
        if (c === '\n' || c === '\r') return value.length >= 8 && value.length <= 128 ? finish() : finish(new Error('Password must contain 8–128 characters.'));
        if (c === '\u007f') value = value.slice(0, -1); else value += c;
      }
    }
    process.stdin.on('data', read);
  });
}
let temporary;
try {
  if (aws('sts', 'get-caller-identity').Account !== account) throw new Error('Unexpected AWS account. No changes made.');
  let existing = optional('lambda', 'get-function', ['--function-name', name], 'ResourceNotFoundException');
  if (existing && existing.Tags?.Project !== 'park-forum') throw new Error('An unrelated Lambda has this name. No changes made.');
  const variables = existing ? { ...existing.Configuration.Environment?.Variables } : {};
  if (!existing || process.argv.includes('--rotate-password')) {
    const password = await readPassword(), salt = randomBytes(16);
    variables.FORUM_PASSWORD_VERIFIER = `${salt.toString('base64url')}:${scryptSync(password, salt, 32).toString('base64url')}`;
    variables.FORUM_SESSION_SECRET = randomBytes(32).toString('base64url');
    variables.FORUM_CATALOG_KEY ||= randomBytes(32).toString('base64url');
  }
  for (const key of ['FORUM_PASSWORD_VERIFIER', 'FORUM_SESSION_SECRET', 'FORUM_CATALOG_KEY']) if (!variables[key]) throw new Error(`Missing ${key}.`);
  const ideasPath = join(root, '_forum-gate/.local/ideas-data.json'), datesPath = join(root, '_forum-gate/.local/dates-data.json');
  if (existsSync(ideasPath) !== existsSync(datesPath)) throw new Error('Import both ideas and dates before deploying.');
  let catalog;
  if (existsSync(ideasPath)) {
    catalog = { ideasData: JSON.parse(readFileSync(ideasPath, 'utf8')), datesData: JSON.parse(readFileSync(datesPath, 'utf8')) };
  } else {
    if (!existing) throw new Error('Import ideas and dates before the first deployment.');
    catalog = decryptCatalog(JSON.parse(readFileSync(envelopePath, 'utf8')), variables.FORUM_CATALOG_KEY);
  }
  if (!catalog.ideasData?.themes?.length || !catalog.datesData?.dates?.length) throw new Error('Catalog is empty.');
  const iv = randomBytes(12), cipher = createCipheriv('aes-256-gcm', Buffer.from(variables.FORUM_CATALOG_KEY, 'base64url'), iv);
  const data = Buffer.concat([cipher.update(JSON.stringify(catalog)), cipher.final()]);
  writeFileSync(envelopePath, JSON.stringify({ version: 1, iv: iv.toString('base64url'), tag: cipher.getAuthTag().toString('base64url'), data: data.toString('base64url') }) + '\n');
  temporary = mkdtempSync(join(tmpdir(), 'forum-lambda-'));
  const zip = join(temporary, 'function.zip');
  const packed = spawnSync('zip', ['-q', zip, 'index.mjs', 'api/access.mjs', 'lib/access.mjs', 'private/catalog.enc.json', 'private/catalog-template.html', 'package.json'], { cwd: join(root, '_forum-gate') });
  if (packed.status !== 0) throw new Error('Could not package the service.');
  let role = optional('iam', 'get-role', ['--role-name', roleName], 'NoSuchEntity');
  if (role && !role.Role.Tags?.some(tag => tag.Key === 'Project' && tag.Value === 'park-forum')) throw new Error('An unrelated IAM role has this name.');
  if (!role) role = aws('iam', 'create-role', [], { RoleName: roleName, Tags: [{ Key: 'Project', Value: 'park-forum' }], AssumeRolePolicyDocument: JSON.stringify({ Version: '2012-10-17', Statement: [{ Effect: 'Allow', Principal: { Service: 'lambda.amazonaws.com' }, Action: 'sts:AssumeRole' }] }) });
  aws('iam', 'put-role-policy', [], { RoleName: roleName, PolicyName: 'ForumLogs', PolicyDocument: JSON.stringify({ Version: '2012-10-17', Statement: [{ Effect: 'Allow', Action: ['logs:CreateLogStream', 'logs:PutLogEvents'], Resource: `arn:aws:logs:${region}:${account}:log-group:${logGroup}:*` }] }) });
  try { aws('logs', 'create-log-group', ['--log-group-name', logGroup, '--tags', 'Project=park-forum']); }
  catch (error) { if (error.code !== 'ResourceAlreadyExistsException') throw error; }
  aws('logs', 'put-retention-policy', ['--log-group-name', logGroup, '--retention-in-days', '14']);
  if (!existing) {
    for (let attempt = 0; ; attempt++) {
      try {
        aws('lambda', 'create-function', ['--zip-file', `fileb://${zip}`], { FunctionName: name, Runtime: 'nodejs22.x', Role: role.Role.Arn, Handler: 'index.handler', Architectures: ['arm64'], MemorySize: 256, Timeout: 15, Environment: { Variables: variables }, Tags: { Project: 'park-forum' }, Description: 'Password-protected Park Forum sponsor catalog' });
        break;
      } catch (error) { if (error.code !== 'InvalidParameterValueException' || attempt >= 8) throw error; await pause(3000); }
    }
  } else {
    aws('lambda', 'update-function-code', ['--function-name', name, '--zip-file', `fileb://${zip}`]);
    await waitForFunction();
    aws('lambda', 'update-function-configuration', [], { FunctionName: name, Environment: { Variables: variables } });
  }
  await waitForFunction();
  let url = optional('lambda', 'get-function-url-config', ['--function-name', name], 'ResourceNotFoundException');
  if (!url) url = aws('lambda', 'create-function-url-config', ['--function-name', name, '--auth-type', 'NONE']);
  if (url.AuthType !== 'NONE') throw new Error('Unexpected Function URL authentication mode.');
  const policy = optional('lambda', 'get-policy', ['--function-name', name], 'ResourceNotFoundException');
  const statements = policy ? JSON.parse(policy.Policy).Statement : [];
  if (!statements.some(s => s.Sid === 'ForumBrowserUrl')) aws('lambda', 'add-permission', ['--function-name', name, '--statement-id', 'ForumBrowserUrl', '--action', 'lambda:InvokeFunctionUrl', '--principal', '*', '--function-url-auth-type', 'NONE']);
  if (!statements.some(s => s.Sid === 'ForumBrowserInvoke')) aws('lambda', 'add-permission', ['--function-name', name, '--statement-id', 'ForumBrowserInvoke', '--action', 'lambda:InvokeFunction', '--principal', '*', '--invoked-via-function-url']);
  const endpoint = new URL('api/access', url.FunctionUrl).href;
  const check = await fetch(endpoint, { headers: { Origin: 'https://bitcoinpark.com' } });
  if (check.status !== 401) throw new Error(`Expected the password gate; received ${check.status}.`);
  writeFileSync(join(root, 'forum/gate-config.js'), `// AWS verifies the password and serves catalog data only to signed sessions.\nexport const accessEndpoint = ${JSON.stringify(endpoint)};\n`);
  console.log(JSON.stringify({ endpoint, functionName: name, region, dates: catalog.datesData.dates.length, ideas: catalog.ideasData.themes.reduce((n, theme) => n + theme.ideas.length, 0), unauthenticatedStatus: check.status }, null, 2));
} catch (error) {
  console.error(error.message); process.exitCode = 1;
} finally { if (temporary) rmSync(temporary, { recursive: true, force: true }); }
