import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { createHash } from 'node:crypto';
const hash = text => createHash('sha256').update(text).digest('hex');
function declarations(folder) {
  const entries = [];
  function visit(dir) {
    for (const item of fs.readdirSync(dir,{withFileTypes:true})) {
      const file=path.join(dir,item.name);
      if(item.isDirectory()){visit(file);continue;}
      if(!/\.tsx?$/.test(file))continue;
      const source=ts.createSourceFile(file,fs.readFileSync(file,'utf8'),ts.ScriptTarget.Latest,true);
      for(const statement of source.statements) {
        if(ts.isFunctionDeclaration(statement)&&statement.name&&statement.body) entries.push({file:path.relative(folder,file),name:statement.name.text,kind:'function-body',hash:hash(statement.body.getText(source))});
        if(ts.isVariableStatement(statement)) for(const decl of statement.declarationList.declarations) {
          if(decl.initializer && !['copy','COPY'].includes(decl.name.getText(source))) entries.push({file:path.relative(folder,file),name:decl.name.getText(source),kind:'initializer',hash:hash(decl.initializer.getText(source))});
        }
      }
    }
  }
  visit(path.join(folder,'src'));return entries;
}
const fixture='docs/fsd-migration/declarations-before.json';
if(process.env.CAPTURE_FSD_DECLARATIONS) fs.writeFileSync(fixture,JSON.stringify(declarations(process.env.CAPTURE_FSD_ROOT || process.cwd()),null,2)+'\n');
test('existing function bodies and state/constants survive architecture moves',()=>{
  const before=JSON.parse(fs.readFileSync(fixture,'utf8'));
  const after=declarations(process.cwd());
  const providerChanges=JSON.parse(fs.readFileSync('docs/laravel-integration/declaration-changes.json','utf8'));
  for(const entry of before) {
    const retired=providerChanges.some(change=>change.retired===true&&change.after===null&&['KNOWN_PROJECTS','extractProjectRef'].includes(change.before.name)&&change.before.hash===entry.hash&&change.before.name===entry.name&&change.before.file===entry.file);
    if(retired) continue;
    assert.ok(after.some(candidate=>candidate.name===entry.name&&candidate.kind===entry.kind&&(candidate.hash===entry.hash || providerChanges.some(change=>change.before.hash===entry.hash&&change.before.name===entry.name&&change.after?.hash===candidate.hash&&change.after.file===candidate.file))),`${entry.file} ${entry.name}: existing logic changed or lost`);
  }
});
test('global CSS, font layout and dictionary payload are preserved',()=>{
  const hashes=JSON.parse(fs.readFileSync('docs/fsd-migration/source-before.json','utf8'));
  assert.equal(hash(fs.readFileSync('src/app/globals.css')),hashes['src/app/globals.css']);
  // Layout imports change; font initialization and all JSX are covered by declaration fingerprints.
  const dictionary=fs.existsSync('src/shared/i18n/messages.ts')?'src/shared/i18n/messages.ts':'src/i18n/messages.ts';
  const strip=source=>source.replace(/^import .*\n/gm,'');
  const expected=JSON.parse(fs.readFileSync('docs/fsd-migration/dictionary-before.json','utf8'));
  assert.equal(hash(strip(fs.readFileSync(dictionary,'utf8'))),expected.payloadSha256);
});
