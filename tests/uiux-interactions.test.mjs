import {test} from 'node:test';
import assert from 'node:assert/strict';
import {renderToStaticMarkup} from 'react-dom/server';
import {harness,nodes} from './helpers/source.mjs';

test('numbered pagination preserves active filters and never links outside valid pages',()=>{
 const h=harness();const {Pagination}=h.load('src/shared/ui/pagination.tsx');
 const tree=h.render(Pagination,{basePath:'/plans',page:3,pageSize:20,total:241,query:{enabled:'true',lifetime:'false'},locale:'ar'});
 const links=nodes(tree,node=>node.props?.href).map(node=>new URL(node.props.href,'https://fixture.invalid'));
 assert.ok(links.length>=5);
 for(const link of links){assert.equal(link.pathname,'/plans');assert.equal(link.searchParams.get('enabled'),'true');assert.equal(link.searchParams.get('lifetime'),'false');assert.ok(Number(link.searchParams.get('page')||1)>=1);assert.ok(Number(link.searchParams.get('page')||1)<=13);}
 const first=h.render(Pagination,{basePath:'/plans',page:1,pageSize:20,total:0,locale:'en'});
 assert.equal(nodes(first,node=>node.props?.href).length,0);
 assert.equal(nodes(first,node=>String(node.props?.['aria-disabled'])==='true').length,2);
});

test('customer tabs follow RTL/LTR keyboard direction with roving focus and Home/End',()=>{
 for(const locale of ['ar','en']){
  const focused=[];const h=harness({globals:{document:{getElementById:id=>({focus:()=>focused.push(id)})}}});
  const {CustomerProfileTabs}=h.load('src/fsd/pages/customer-details/ui/customer-profile-tabs.tsx');
  const props={locale,labels:{overview:'Overview',subscription:'Subscription',licensing:'Licensing',history:'History'},overview:'overview',subscription:'subscription',licensing:'licensing',history:'history'};
  let tree=h.render(CustomerProfileTabs,props);let prevented=false;
  nodes(tree,n=>n.props?.role==='tab')[0].props.onKeyDown({key:locale==='ar'?'ArrowLeft':'ArrowRight',preventDefault(){prevented=true}});
  tree=h.render(CustomerProfileTabs,props);assert.equal(prevented,true);assert.equal(nodes(tree,n=>n.props?.role==='tab'&&n.props?.['aria-selected'])[0].props.id,'customer-tab-subscription');assert.equal(nodes(tree,n=>n.props?.role==='tab'&&n.props.tabIndex===0).length,1);assert.deepEqual(focused,['customer-tab-subscription']);
  nodes(tree,n=>n.props?.role==='tab')[1].props.onKeyDown({key:'End',preventDefault(){}});tree=h.render(CustomerProfileTabs,props);assert.equal(nodes(tree,n=>n.props?.role==='tabpanel')[0].props.id,'customer-panel-history');
 }
});

test('quick navigation searches localized names and paths, including a recoverable empty result',()=>{
 const h=harness();const {QuickNavigation}=h.load('src/widgets/dashboard-shell/ui/quick-navigation.tsx');
 let tree=h.render(QuickNavigation,{locale:'ar'});
 nodes(tree,n=>n.type==='input')[0].props.onChange({target:{value:'الأجهزة'}});tree=h.render(QuickNavigation,{locale:'ar'});
 assert.deepEqual(nodes(tree,n=>n.props?.href).map(n=>n.props.href),['/devices']);
 nodes(tree,n=>n.type==='input')[0].props.onChange({target:{value:'not-a-screen'}});tree=h.render(QuickNavigation,{locale:'ar'});
 assert.equal(nodes(tree,n=>n.props?.href).length,0);assert.equal(nodes(tree,n=>n.props?.role==='status').length,1);
 nodes(tree,n=>n.type==='input')[0].props.onChange({target:{value:'/plans'}});tree=h.render(QuickNavigation,{locale:'ar'});assert.equal(nodes(tree,n=>n.props?.href)[0].props.href,'/plans');
});

test('form dialog focuses a field, locks background scroll and exposes a described native modal',()=>{
 const calls=[];const h=harness({globals:{document:{body:{style:{overflow:'',removeProperty:key=>calls.push(key)}}}}});
 const {ActionDialog}=h.load('src/shared/ui/action-dialog.tsx');const tree=h.render(ActionDialog,{triggerLabel:'Create',title:'Create plan',description:'Review your plan',children:'form'});
 const dialog=nodes(tree,n=>n.type==='dialog')[0];dialog.props.ref.current={showModal:()=>calls.push('showModal'),querySelector:()=>({focus:()=>calls.push('field focus')}),close:()=>calls.push('close')};
 nodes(tree,n=>n.type==='button')[0].props.onClick();assert.deepEqual(calls,['showModal','field focus']);assert.equal(dialog.props['aria-describedby'],'fixture-id');dialog.props.onCancel();assert.equal(calls.at(-1),'overflow');
});

test('settings permissions describe the verified role without enabling mutations',async()=>{
 for(const [role,allowed] of [['owner',3],['admin',3],['support',2],['viewer',1]]){
  const h=harness({role});const {SettingsPage}=h.load('src/fsd/pages/settings/ui/settings-page.tsx');const html=renderToStaticMarkup(await SettingsPage());assert.equal((html.match(/>Allowed</g)||[]).length,allowed,role);assert.equal((html.match(/<form/g)||[]).length,0);
 }
});

test('login preserves entered email on server error and password reveal does not change its form name',()=>{
 const h=harness();const {LoginForm}=h.load('src/features/sign-in/ui/login-form.tsx');let tree=h.render(LoginForm,{locale:'en',next:'/plans'});
 nodes(tree,n=>n.props?.name==='email')[0].props.onChange({target:{value:'viewer@example.invalid'}});h.actionState({error:'invalid_credentials'});tree=h.render(LoginForm,{locale:'en',next:'/plans'});
 assert.equal(nodes(tree,n=>n.props?.name==='email')[0].props.value,'viewer@example.invalid');assert.equal(nodes(tree,n=>n.props?.name==='password')[0].props['aria-describedby'],'sign-in-error');
 nodes(tree,n=>n.type==='button'&&n.props['aria-pressed']!==undefined)[0].props.onClick();tree=h.render(LoginForm,{locale:'en',next:'/plans'});assert.equal(nodes(tree,n=>n.props?.name==='password')[0].props.type,'text');assert.equal(nodes(tree,n=>n.props?.name==='next')[0].props.value,'/plans');
});

test('core design tokens meet text, focus and input-boundary contrast thresholds',async()=>{
 const {readFile}=await import('node:fs/promises');const css=await readFile('src/app/globals.css','utf8');
 const token=name=>new RegExp(`--${name}:\\s*(#[0-9a-f]{6}|#[0-9a-f]{3})`,'i').exec(css)?.[1];
 function luminance(hex){if(hex.length===4)hex='#'+hex.slice(1).split('').map(c=>c+c).join('');const [r,g,b]=hex.slice(1).match(/../g).map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return r*.2126+g*.7152+b*.0722;}
 function contrast(a,b){const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
 for(const [a,b,min] of [[token('text'),'#ffffff',4.5],[token('text-muted'),'#ffffff',4.5],[token('on-primary'),token('primary'),4.5],[token('side-muted'),token('side-bg'),4.5],[token('ring'),'#ffffff',3],['#8792ad','#ffffff',3]])assert.ok(contrast(a,b)>=min,`${a} on ${b} must reach ${min}:1`);
 assert.match(css,/border:\s*1px solid #8792ad/);
});
