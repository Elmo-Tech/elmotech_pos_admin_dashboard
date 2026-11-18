import { test } from 'node:test';
import assert from 'node:assert/strict';
import { harness, nodes, ids, fixedNow } from './helpers/source.mjs';
const activationFile='src/components/activation/activation-workflow.tsx';
const renewalFile='src/components/commercial/renew-subscription.tsx';
const context={request:{request_id:ids.request,status:'validated',received_at:fixedNow,app_version:'1'},license:{id:ids.license,status:'active'},customer:{id:ids.customer,business_name:'Fixture',customer_code:'C1',status:'active'},device:null};
function named(tree,name){const found=nodes(tree,node=>node.type==='button'&&node.props.onClick?.name===name)[0];assert.ok(found,`Button handler ${name} exists`);return found;}
test('activation UI: preserves selected bytes, verify/issue endpoints, download-again and reset lifecycle',async()=>{
 const calls=[],downloads=[],revoked=[];
 class FixtureURL extends URL {static createObjectURL(){return 'blob:fixture';}static revokeObjectURL(url){revoked.push(url);}}
 const h=harness({globals:{URL:FixtureURL,document:{createElement:()=>({click(){downloads.push([this.href,this.download]);}})},fetch:async(url,options)=>{
  calls.push([url,options]);return url.endsWith('verify')?Response.json({context,outcome:'verifiedAndRecorded'}):new Response(new Uint8Array([0,255,13]),{headers:{'content-disposition':'attachment; filename="fixture.elmolic"'}});
 }}});
 const component=h.exported(activationFile,'ActivationWorkflow');const props={locale:'en',environment:'staging'};
 let tree=h.render(component,props);const file=new File([' {"format":"ELMOREQ"}\r\n'],'fixture.elmoreq',{type:'application/octet-stream'});
 nodes(tree,node=>node.type==='input'&&node.props.type==='file')[0].props.onChange({target:{files:[file]}});
 tree=h.render(component,props);await named(tree,'verify').props.onClick();
 assert.equal(calls[0][0],'/api/activation/verify');assert.equal(await calls[0][1].body.get('file').text(),await file.text());
 tree=h.render(component,props);await named(tree,'issue').props.onClick();
 assert.deepEqual(JSON.parse(calls[1][1].body),{requestId:ids.request});assert.equal(calls[1][0],'/api/activation/issue');
 assert.deepEqual(downloads,[['blob:fixture','fixture.elmolic']]);
 tree=h.render(component,props);
 const again=nodes(tree,node=>node.type==='button'&&node.props.children?.[1]==='Download file again')[0];
 assert.ok(again);again.props.onClick();assert.equal(calls.length,2);assert.equal(downloads.length,2);
 named(tree,'resetWorkflow').props.onClick();tree=h.render(component,props);assert.ok(revoked.includes('blob:fixture'));assert.equal(nodes(tree,node=>node.props?.onClick?.name==='issue').length,0);
});
test('renewal UI: explicit retry retains operation ID and plan payload, locks selection after error, refreshes on success',async()=>{
 const requests=[];let attempt=0,uuidCalls=0;
 class FixtureURL extends URL{static createObjectURL(){return 'blob:renewal';}static revokeObjectURL(){}}
 const h=harness({globals:{URL:FixtureURL,crypto:{randomUUID:()=>{uuidCalls++;return ids.operation;}},fetch:async(url,options)=>{
  requests.push([url,JSON.parse(options.body)]);attempt++;
  return attempt===1?Response.json({outcome:'renewalUnavailable'},{status:422}):new Response(new Uint8Array([1,0,255]),{headers:{'content-disposition':'attachment; filename="renewal.elmolic"','x-license-expires-at':'2027-02-28T00:00:00Z'}});
 }}});
 const props={locale:'en',subscription:{plan_name_snapshot:'Monthly',expires_at:'2027-01-31T00:00:00Z',is_lifetime:false},licenseId:ids.license,plans:[{id:ids.plan,name:'Monthly',is_lifetime:false,duration_value:1,duration_unit:'months',price:150,currency:'EGP'}],referenceNow:fixedNow,unavailableReason:'none'};
 const component=h.exported(renewalFile,'RenewSubscription');let tree=h.render(component,props);
 nodes(tree,node=>node.type==='button')[0].props.onClick();tree=h.render(component,props);
 await named(tree,'renew').props.onClick();assert.equal(requests.length,1);
 tree=h.render(component,props);assert.equal(nodes(tree,node=>node.type==='select')[0].props.disabled,true);
 await named(tree,'renew').props.onClick();tree=h.render(component,props);
 assert.equal(uuidCalls,1);assert.equal(requests.length,2);assert.deepEqual(requests[0],requests[1]);
 assert.deepEqual(requests[0],['/api/renewal/issue',{licenseId:ids.license,planId:ids.plan,operationId:ids.operation}]);
 assert.equal(h.calls.filter(call=>call[0]==='refresh').length,1);
 assert.equal(nodes(tree,node=>node.type==='a'&&node.props.download==='renewal.elmolic')[0].props.href,'blob:renewal');
});
