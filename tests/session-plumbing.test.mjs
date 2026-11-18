import { test } from 'node:test';
import assert from 'node:assert/strict';
import { harness } from './helpers/source.mjs';

test('proxy forwards pathname without reading or refreshing any Supabase cookie',async()=>{
 const h=harness({mocks:{'next/server':{NextResponse:{next:({request})=>({requestHeaders:request.headers})}}}});
 const request={headers:new Headers({'x-pathname':'/spoof'}),nextUrl:{pathname:'/plans'},cookies:{getAll:()=>{throw Error('Unexpected legacy cookie access');}}};
 const result=await h.load('src/proxy.ts').proxy(request);
 assert.equal(result.requestHeaders.get('x-pathname'),'/plans');
});

test('retired SSR and browser Supabase clients fail before any network initialization',async()=>{
 const h=harness({globals:{process:{env:{DATA_PROVIDER:'supabase',NEXT_PUBLIC_SUPABASE_URL:'https://fixture.supabase.co',SUPABASE_SECRET_KEY:'fixture-only'}}}});
 await assert.rejects(h.load('src/shared/api/supabase/server.ts').getSupabaseServerClient(),/disabled/);
 assert.throws(()=>h.load('src/shared/api/supabase/client.ts').getSupabaseBrowserClient(),/disabled/);
 assert.throws(()=>h.load('src/shared/config/public.ts').getPublicEnv(),/disabled/);
 assert.throws(()=>h.load('src/shared/config/server.ts').getRequiredSupabaseUrl(),/disabled/);
});

test('environment identity rejects disabled providers and local production mode',()=>{
 for(const env of [{APP_ENV:'production',NODE_ENV:'development'},{DATA_PROVIDER:'supabase'},{APP_ENV:'invalid'}]){
  assert.throws(()=>harness({globals:{process:{env}}}).load('src/shared/config/server.ts').getServerEnvironment());
 }
 const h=harness({globals:{process:{env:{APP_ENV:'staging',NODE_ENV:'development',NEXT_PUBLIC_SUPABASE_URL:'https://unused.invalid'}}}});
 assert.equal(h.load('src/shared/config/server.ts').getServerEnvironment(),'staging');
});
