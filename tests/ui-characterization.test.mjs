import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { renderToStaticMarkup } from 'react-dom/server';
import { harness, ids, nodes, fixedNow } from './helpers/source.mjs';
const cases = [
 ['shell','src/components/layout/dashboard-shell.tsx','DashboardShell',{environment:'staging',userEmail:'fixture@example.invalid',userRole:'Owner',children:'Fixture content'}],
 ['login','src/components/auth/login-form.tsx','LoginForm',{next:'/plans?enabled=true'}],
 ['create-customer','src/components/commercial/commercial-forms.tsx','CreateCustomerForm',{}],
 ['provision','src/components/commercial/commercial-forms.tsx','AddSubscriptionForm',{customerId:ids.customer,plans:[{id:ids.plan,name:'Quarterly',is_lifetime:false,duration_value:3,duration_unit:'months'}],canProvision:true}],
 ['one-time-code','src/components/commercial/commercial-forms.tsx','AddSubscriptionForm',{customerId:ids.customer,plans:[],canProvision:true}, {status:'success',licenseCode:'ELMO-FIXTURE-CODE'}],
 ['rotation-confirm','src/components/commercial/commercial-forms.tsx','RotateLicenseCodeForm',{licenseId:ids.license},null,true],
 ['activation','src/components/activation/activation-workflow.tsx','ActivationWorkflow',{environment:'staging'}],
 ['renewal-open','src/components/commercial/renew-subscription.tsx','RenewSubscription',{subscription:{plan_name_snapshot:'Quarterly',expires_at:'2027-01-31T00:00:00Z',is_lifetime:false},licenseId:ids.license,plans:[{id:ids.plan,name:'Quarterly',duration_value:1,duration_unit:'months',price:150,currency:'EGP',is_lifetime:false}],referenceNow:fixedNow,unavailableReason:'none'},null,true],
];
const fixture='docs/fsd-migration/ui-before.json';
const hashes={};
for(const locale of ['ar','en']) for(const [name,file,symbol,props,state,open] of cases) {
 const h=harness({locale});if(state)h.actionState(state);
 const component=h.exported(file,symbol);let tree=h.render(component,{...props,locale});
 if(open){const button=nodes(tree,node=>node.type==='button'&&node.props.onClick)[0];button.props.onClick();tree=h.render(component,{...props,locale});}
 hashes[`${name}:${locale}`]=createHash('sha256').update(renderToStaticMarkup(tree)).digest('hex');
}
if(process.env.CAPTURE_FSD_UI)fs.writeFileSync(fixture,JSON.stringify(hashes,null,2)+'\n');
test('Arabic/English shell, forms, one-time code, activation and renewal markup match baseline',()=>{
 assert.deepEqual(hashes,JSON.parse(fs.readFileSync(fixture,'utf8')));
});
