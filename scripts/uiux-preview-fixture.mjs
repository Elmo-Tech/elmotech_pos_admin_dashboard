// Disposable UI preview transport. NOT Laravel acceptance or a deployed service.
// Only listens on loopback. Never reads .env, databases, or real credentials.
// Start frontend with APP_ENV=staging DATA_PROVIDER=laravel
// LARAVEL_API_URL=http://127.0.0.1:8340/api/v1 . See UIUX_REFACTOR.md.
import http from 'node:http';
import { randomUUID } from 'node:crypto';
const id = (group,n) => `${group.repeat(8)}-${group.repeat(4)}-4${group.repeat(3)}-8${group.repeat(3)}-${String(n).padStart(12,'0')}`;
const date = (month,day=12) => new Date(Date.UTC(2026,month-1,day)).toISOString();
const names=['مكتبة النور','متجر الأصيل','ماركت المدينة','صيدلية الحياة','بيت القهوة','مخبز البركة'];
const data={
 customers:Array.from({length:26},(_,n)=>({id:id('1',n+1),customer_code:`CUS-${String(n+1).padStart(4,'0')}`,business_name:n<6?names[n]:`Demo Store ${n+1}`,owner_name:['أحمد محمود','سارة علي','محمد حسن'][n%3],phone:'01000000000',email:`store${n+1}@example.invalid`,address:'القاهرة — بيانات تجريبية',tax_id:null,notes:'Disposable UI preview record',status:n===5?'suspended':'active',created_at:date(6+n%6,n%25+1),updated_at:date(11)})),
 plans:Array.from({length:26},(_,n)=>({id:id('2',n+1),name:['الخطة الشهرية','الخطة السنوية','مدى الحياة'][n%3]+(n>2?` ${n+1}`:''),code:`PLAN-${n+1}`,is_enabled:n%4!==3,is_lifetime:n%3===2,is_trial:false,duration_value:n%3===2?null:n%3===0?1:12,duration_unit:n%3===2?null:'months',price:n%3===2?4500:n%3===0?299:2499,currency:'EGP',notes:'Disposable preview plan',created_at:date(9)})),
 subscriptions:[],licenses:[],device_activations:[],activation_requests:[],license_issuances:[],audit_logs:[]
};
for(let n=0;n<26;n++) {
 const plan=data.plans[n%3];
 data.subscriptions.push({id:id('5',n+1),customer_id:data.customers[n].id,plan_id:plan.id,plan_name_snapshot:plan.name,status:n<3?'expired':'active',is_lifetime:plan.is_lifetime,starts_at:date(10,1),expires_at:plan.is_lifetime?null:n<3?date(11,1):n<9?date(12,1):date(12,31),duration_value_snapshot:plan.duration_value,duration_unit_snapshot:plan.duration_unit,price_snapshot:plan.price,currency_snapshot:plan.currency,created_at:date(10),updated_at:date(11)});
 data.licenses.push({id:id('3',n+1),customer_id:data.customers[n].id,subscription_id:id('5',n+1),status:n<3?'expired':'active',max_active_devices:1,highest_issued_revision:1,created_at:date(10),updated_at:date(11)});
 if(n<12)data.device_activations.push({id:id('7',n+1),license_id:id('3',n+1),status:'active',activation_type:'initial',device_fingerprint_hash:'fixture-fingerprint',activated_at:date(10),last_issued_at:date(11),created_at:date(10)});
 if(n<4)data.activation_requests.push({request_id:id('4',n+1),license_id:id('3',n+1),status:['pending','validated','consumed','rejected'][n],app_version:'1.0.0',received_at:date(11,18-n),expires_at:date(12),device_activation_id:n===2?id('7',n+1):null,created_at:date(11)});
 if(n<4)data.license_issuances.push({id:id('8',n+1),license_id:id('3',n+1),device_activation_id:id('7',n+1),activation_request_id:id('4',n+1),issuance_type:'initial',reason:'initial',revision:1,key_id:'preview-key',is_lifetime:false,license_revision:1,issued_at:date(11,15),created_at:date(11,15),expires_at:date(12),operation_id:null});
 if(n<7)data.audit_logs.push({id:id('9',n+1),customer_id:data.customers[n].id,license_id:id('3',n+1),action:['customer_created','subscription_created','license_issued'][n%3],actor_user_id:'preview-owner',metadata:{source:'Disposable UI preview'},created_at:date(11,18-n)});
}
const tokens=new Map();let failedResource='';
const response=(res,status,body)=>{res.writeHead(status,{'content-type':'application/json'});res.end(JSON.stringify(body))};
function match(row,{column,operator,value}){const a=row[column];switch(operator){case'eq':return a===value;case'in':return value.includes(a);case'gt':return a>value;case'gte':return a>=value;case'lte':return a<=value;case'ilike':return String(a??'').toLowerCase().includes(String(value).replaceAll('%','').toLowerCase());default:return false;}}
const server=http.createServer(async(req,res)=>{try{
 const url=new URL(req.url,'http://127.0.0.1:8340');const route=url.pathname.replace(/^\/api\/v1\//,'');
 if(url.pathname==='/preview-control'){failedResource=url.searchParams.get('fail')??'';return response(res,200,{failedResource})}
 let chunks=[];for await(const chunk of req)chunks.push(chunk);const raw=Buffer.concat(chunks);const body=raw.length?JSON.parse(raw.toString()):{};
 if(route==='auth/login'){
  const role=body.email?.split('@')[0];if(!['owner','admin','support','viewer'].includes(role)||body.password!=='preview-only')return response(res,422,{errors:{email:['Invalid preview credentials']}});
  const token=randomUUID();tokens.set(token,role);return response(res,200,{token});
 }
 const token=req.headers.authorization?.replace('Bearer ','');const role=tokens.get(token);if(!role)return response(res,401,{message:'Unauthenticated'});
 if(route==='auth/me')return response(res,200,{user:{id:'preview-actor',email:`${role}@uiux.invalid`,role,is_active:true}});
 if(route==='auth/logout'){tokens.delete(token);return response(res,200,{ok:true})}
 const resource=/^data\/([^/]+)\/query$/.exec(route)?.[1];
 if(resource&&data[resource]){
  if(resource===failedResource)return response(res,503,{message:'Deliberate preview error'});
  let rows=structuredClone(data[resource]);for(const filter of body.filters??[])rows=rows.filter(row=>match(row,filter));
  for(const clause of body.or??[])rows=rows.filter(row=>clause.split(',').some(part=>{const [column,operator,...value]=part.split('.');const v=value.join('.');return match(row,{column,operator,value:v==='true'?true:v==='false'?false:v});}));
  const count=rows.length;for(const order of [...body.orders??[]].reverse())rows.sort((a,b)=>String(a[order.column]).localeCompare(String(b[order.column]))*(order.ascending?1:-1));
  return response(res,200,{data:body.head?null:rows.slice(body.offset??0,(body.offset??0)+(body.limit??1000)),count});
 }
 if((route==='plans'||route.startsWith('plans/'))&&['POST','PATCH'].includes(req.method)){
  if(!['owner','admin'].includes(role))return response(res,403,{message:'Forbidden'});
  if(req.method==='PATCH'){Object.assign(data.plans.find(p=>p.id===route.split('/')[1])??{},body);return response(res,200,{outcome:'updated',planId:route.split('/')[1]})}
  const planId=randomUUID();data.plans.unshift({...body,id:planId,code:'PREVIEW-NEW',created_at:new Date().toISOString()});return response(res,201,{outcome:'created',planId});
 }
 return response(res,422,{message:'Preview does not implement this operation. No real backend was called.'});
 }catch{response(res,400,{message:'Invalid preview request'})}});
server.listen(8340,'127.0.0.1',()=>console.log('Disposable UI preview transport: 127.0.0.1:8340 (no real backend)'));
