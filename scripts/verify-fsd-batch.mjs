// Migration evidence runner. Always builds a source snapshot without .env files.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
const root = process.cwd();
const batch = process.argv[2];
if (!/^(batch-[1-4]|final)$/.test(batch || '')) throw new Error('Use batch-1 through batch-4, or final');
const out = path.join(root, 'docs/fsd-migration');
const workspace = JSON.parse(fs.readFileSync(path.join(out, 'workspace.json'), 'utf8'));
const snapshot = fs.mkdtempSync(path.join(workspace.scratch, batch+'-'));
const checks = [];
function command(id, args, cwd = root, env = process.env) {
  const logfile = `${batch}-${id}.log`;
  const fd = fs.openSync(path.join(out, logfile), 'w');
  const result = spawnSync(args[0], args.slice(1), { cwd, env, stdio: ['ignore',fd,fd] });
  fs.closeSync(fd);
  checks.push({ id, command: args, cwd, exitCode: result.status, error: result.error?.message, log: logfile });
  process.stdout.write(`${id}: ${result.status ?? result.error?.message}\n`);
  return result.status === 0;
}
command('lint', ['npm','run','lint']);
command('types', ['./node_modules/.bin/tsc','--noEmit','--incremental','false']);
command('tests', ['node','--test', ...fs.readdirSync('tests').filter(name=>name.endsWith('.test.mjs')).map(name=>'tests/'+name)]);
// Snapshot all application source, public assets and tracked config. No local env or Git data.
const tracked = spawnSync('git',['ls-files','-z'],{encoding:'utf8'}).stdout.split('\0');
for (const name of new Set([...tracked, 'next-env.d.ts'])) {
  if (!name || name.startsWith('.env') || name.startsWith('src/') || !fs.existsSync(name) || !fs.statSync(name).isFile()) continue;
  const target = path.join(snapshot,name);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(name,target);
}
fs.cpSync('src',path.join(snapshot,'src'),{recursive:true});
if (fs.existsSync('public')) fs.cpSync('public',path.join(snapshot,'public'),{recursive:true});
const copied = spawnSync('cp', process.platform === 'darwin' ? ['-cR',path.join(root,'node_modules'),path.join(snapshot,'node_modules')] : ['-R',path.join(root,'node_modules'),path.join(snapshot,'node_modules')]);
if (copied.status !== 0) throw new Error('Could not copy installed dependencies');
const safeEnv = { ...process.env };
for (const key of Object.keys(safeEnv)) if (key.startsWith('NEXT_PUBLIC_') || key.startsWith('SUPABASE_') || key === 'APP_ENV') delete safeEnv[key];
const built = command('webpack', ['npm','run','build','--','--webpack'],snapshot,safeEnv);
if (built) {
  const baseline = JSON.parse(fs.readFileSync(path.join(out,'routes-baseline.json'),'utf8'));
  const manifests = {};
  for (const file of Object.keys(baseline).filter(key=>key!=='proxyMatch')) manifests[file] = JSON.parse(fs.readFileSync(path.join(snapshot,'.next',file),'utf8'));
  const middleware = JSON.parse(fs.readFileSync(path.join(snapshot,'.next/server/middleware-manifest.json'),'utf8'));
  manifests.proxyMatch = Object.fromEntries(Object.entries(middleware.middleware).map(([key,value])=>[key,value.matchers]));
  fs.writeFileSync(path.join(out,`${batch}-routes.json`),JSON.stringify(manifests,null,2)+'\n');
  const normalized = value => JSON.stringify(value,(_key,item)=>item && !Array.isArray(item) && typeof item === 'object' ? Object.fromEntries(Object.entries(item).sort(([a],[b])=>a.localeCompare(b))) : item);
  const equal = normalized(manifests) === normalized(baseline);
  fs.writeFileSync(path.join(out,`${batch}-route-comparison.log`),equal?'PASS: full app-paths/pages/routes manifests and proxy matchers identical.\n':'FAIL: manifests differ.\n');
  checks.push({ id:'routes',exitCode:equal?0:1,log:`${batch}-route-comparison.log` });
}
fs.writeFileSync(path.join(out,`${batch}-results.json`),JSON.stringify({batch,snapshot,checks},null,2)+'\n');
if (checks.some(check=>check.exitCode!==0)) process.exitCode=1;
