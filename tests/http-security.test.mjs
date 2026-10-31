import test from 'node:test';
import assert from 'node:assert/strict';
import {openDatabase} from '../app/db.mjs';
import {seed} from '../scripts/seed.mjs';
import {createApp} from '../app/server.mjs';
test('[Security HTTP] leader cannot mutate/register; export opt-in excludes IDs and escapes CSV formula',async()=>{
 const db=await openDatabase({file:':memory:',url:null});await db.migrate();await seed(db,{demo:true});const app=await createApp({db,demo:true,migrate:false,auth:{supabase:false}});await new Promise(r=>app.server.listen(0,'127.0.0.1',r));const origin=`http://127.0.0.1:${app.server.address().port}`;
 try{const login=await fetch(origin+'/api/login',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({username:'LEADER',password:'DemoMandarin!2026'})}),body=await login.json(),cookie=login.headers.get('set-cookie').split(';')[0];const request=(path,method='GET',data={})=>fetch(origin+path,{method,headers:{Cookie:cookie,Origin:origin,'Content-Type':'application/json','X-CSRF-Token':body.csrf},body:method==='GET'?undefined:JSON.stringify(data)});
  for(const[path,method,data]of [['/api/profile','PATCH',{name:'Hacked'}],['/api/exams','POST',{track:'hsk'}],['/api/register','POST',{}]])assert.equal((await request(path,method,data)).status,403);
  assert.equal((await request('/api/leader/export')).status,403);await db.run('UPDATE app_config SET value=? WHERE id=?',['true','allow_export']);await db.run("UPDATE profiles SET name='=DANGEROUS()' WHERE employee_id='DEMO002'");const exported=await request('/api/leader/export');assert.equal(exported.status,200);const text=await exported.text();assert(text.includes("'=DANGEROUS()"));assert(!text.includes('DEMO002'));assert(!text.includes('example.invalid'));assert.equal((await db.get("SELECT COUNT(*) c FROM audit_logs WHERE action='shared_leader_export'")).c,1);
  await db.run('UPDATE profiles SET name=? WHERE employee_id=?',['\t=SPREADSHEET_FORMULA()','DEMO002']);const whitespaceExport=await request('/api/leader/export');assert((await whitespaceExport.text()).includes("'\t=SPREADSHEET_FORMULA()"));
  const invalid=await fetch(origin+'/api/login',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:'null'});assert.equal(invalid.status,400);
 }finally{await new Promise(r=>app.server.close(r));await db.close();}
});
