import { test } from 'node:test';
import assert from 'node:assert/strict';
import { harness } from './helpers/source.mjs';
const publicEnv={supabaseUrl:'https://fixture.invalid',supabasePublishableKey:'fixture-publishable-placeholder'};
test('proxy forwards pathname and refreshed request/response cookies without taking over RBAC',async()=>{
 const cookies=new Map([['old','cookie']]);let claims=0;
 const h=harness({mocks:{
  '@/shared/config/public':{getPublicEnv:()=>publicEnv},
  '@/lib/env':{getPublicEnv:()=>publicEnv},
  'next/server':{NextResponse:{next:({request})=>({requestHeaders:request.headers,cookies:{values:new Map(),set(name,value,options){this.values.set(name,{value,options});}}})}},
  '@supabase/ssr':{createServerClient:(_url,_key,{cookies:adapter})=>({auth:{getClaims:async()=>{
   claims++;assert.deepEqual(adapter.getAll(),[{name:'old',value:'cookie'}]);adapter.setAll([{name:'fresh',value:'rotated',options:{httpOnly:true}}]);return {};
  }}})},
 }});
 const request={headers:new Headers({'x-pathname':'/spoof'}),nextUrl:{pathname:'/plans',search:'?enabled=true'},cookies:{getAll:()=>[...cookies].map(([name,value])=>({name,value})),set:(name,value)=>cookies.set(name,value)}};
 const result=await h.load('src/proxy.ts').proxy(request);
 assert.equal(claims,1);assert.equal(result.requestHeaders.get('x-pathname'),'/plans');assert.equal(cookies.get('fresh'),'rotated');
 assert.deepEqual(result.cookies.values.get('fresh'),{value:'rotated',options:{httpOnly:true}});
});
test('SSR auth client preserves cookie options and tolerates read-only Server Component cookie writes',async()=>{
 for(const readOnly of [false,true]){
  let adapter;const written=[];
  const h=harness({mocks:{
   '@/shared/config/public':{getPublicEnv:()=>publicEnv},'@/lib/env':{getPublicEnv:()=>publicEnv},
   'next/headers':{cookies:async()=>({getAll:()=>[{name:'session',value:'fixture'}],set:(...args)=>{if(readOnly)throw new Error('read-only');written.push(args);}})},
   '@supabase/ssr':{createServerClient:(url,key,options)=>{assert.equal(url,publicEnv.supabaseUrl);assert.equal(key,publicEnv.supabasePublishableKey);adapter=options.cookies;return {fixture:true};}},
  }});
  assert.deepEqual(await h.exported('src/server/supabase/server.ts','getSupabaseServerClient')(),{fixture:true});
  assert.deepEqual(adapter.getAll(),[{name:'session',value:'fixture'}]);
  assert.doesNotThrow(()=>adapter.setAll([{name:'session',value:'new',options:{sameSite:'lax'}}]));
  assert.equal(written.length,readOnly?0:1);
 }
});
test('environment identity still rejects wrong projects and local production mode',()=>{
 for(const env of [
  {APP_ENV:'production',NODE_ENV:'development'},
  {DATA_PROVIDER:'supabase',APP_ENV:'staging',NEXT_PUBLIC_SUPABASE_URL:'https://unknown-project.supabase.co'},
  {APP_ENV:'invalid'},
 ]){
  const h=harness({globals:{process:{env}}});
  assert.throws(()=>h.exported('src/server/env.ts','getServerEnvironment')());
 }
 const h=harness({globals:{process:{env:{APP_ENV:'staging',NODE_ENV:'development'}}}});
 assert.equal(h.exported('src/server/env.ts','getServerEnvironment')(),'staging');
 assert.throws(()=>h.exported('src/server/env.ts','getRequiredSupabaseUrl')(),/required/);
});
