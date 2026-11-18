import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
const files=[];
function walk(dir){for(const item of fs.readdirSync(dir,{withFileTypes:true})){const file=path.join(dir,item.name);if(item.isDirectory())walk(file);else if(/\.tsx?$/.test(file))files.push(file);}}
walk('src');
function owner(file){
 const parts=file.split('/');
 if(parts[1]==='app'||file==='src/proxy.ts')return {rank:6,slice:'app'};
 if(parts[1]==='fsd'&&parts[2]==='pages')return {rank:5,slice:parts.slice(0,4).join('/')};
 const rank={widgets:4,features:3,entities:2,shared:1}[parts[1]];
 assert.ok(rank,`FSD owner for ${file}`);return {rank,slice:rank===1?'shared':parts.slice(0,3).join('/')};
}
const graph=new Map();const runtime=new Map();
for(const file of files){
 const source=ts.createSourceFile(file,fs.readFileSync(file,'utf8'),ts.ScriptTarget.Latest,true);const edges=[],runtimeEdges=[];
 for(const node of source.statements){
  if(!(ts.isImportDeclaration(node)||ts.isExportDeclaration(node))||!node.moduleSpecifier||!ts.isStringLiteral(node.moduleSpecifier))continue;
  const spec=node.moduleSpecifier.text;if(spec.endsWith('.css'))continue;
  const base=spec.startsWith('@/')?'src/'+spec.slice(2):spec.startsWith('.')?path.join(path.dirname(file),spec):null;
  if(!base)continue;
  const target=[base,base+'.ts',base+'.tsx',base+'/index.ts'].find(p=>files.includes(p));assert.ok(target,`${file}: resolves ${spec}`);edges.push(target);
  const typeOnly=node.isTypeOnly||node.importClause?.isTypeOnly||(
   ts.isImportDeclaration(node)&&node.importClause?.namedBindings&&ts.isNamedImports(node.importClause.namedBindings)&&!node.importClause.name&&node.importClause.namedBindings.elements.every(element=>element.isTypeOnly));
  if(!typeOnly)runtimeEdges.push(target);
 }
 graph.set(file,edges);runtime.set(file,runtimeEdges);
}
test('full source respects FSD layer direction, peer isolation and cross-slice public APIs',()=>{
 for(const [file,edges] of graph){const from=owner(file);for(const target of edges){const to=owner(target);
  assert.ok(to.rank<=from.rank,`${file} imports upward into ${target}`);
  if(from.rank===to.rank&&from.rank!==1)assert.equal(from.slice,to.slice,`${file} imports a peer slice ${target}`);
  if(from.slice!==to.slice&&to.rank>=2&&to.rank<=5)assert.ok(target===`${to.slice}/index.ts`||target===`${to.slice}/server.ts`,`${file} bypasses public API: ${target}`);
 }}
 const active=new Set(),done=new Set();function visit(file){assert.ok(!active.has(file),`Import cycle: ${file}`);if(done.has(file))return;active.add(file);for(const next of graph.get(file))visit(next);active.delete(file);done.add(file);}
 for(const file of files)visit(file);
});
test('client entries cannot reach server-only implementations; Server Actions remain explicit boundaries',()=>{
 for(const file of files){if(!/^['"]use client['"]/.test(fs.readFileSync(file,'utf8')))continue;
  const visited=new Set();function visit(target){if(visited.has(target))return;visited.add(target);const source=fs.readFileSync(target,'utf8');
   if(/^['"]use server['"]/.test(source))return;
   assert.ok(!/import\s+['"]server-only['"]/.test(source),`${file} reaches server-only ${target}`);
   assert.ok(!/from\s+['"]node:/.test(source),`${file} reaches Node implementation ${target}`);
   for(const next of runtime.get(target))visit(next);
  }visit(file);
 }
});
test('all page public APIs remain server-only and no legacy source trees remain',()=>{
 for(const slice of fs.readdirSync('src/fsd/pages'))assert.match(fs.readFileSync(`src/fsd/pages/${slice}/index.ts`,'utf8'),/import "server-only"/);
 for(const legacy of ['src/components','src/server','src/lib','src/types','src/i18n','src/pages'])assert.ok(!fs.existsSync(legacy),`${legacy} remains`);
});
