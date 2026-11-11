import test from 'node:test';
import assert from 'node:assert/strict';
import {openDatabase} from '../app/db.mjs';
import {createApp} from '../app/server.mjs';
import {seed} from '../scripts/seed.mjs';
import {Service} from '../app/service.mjs';
import {LearningCenter} from '../app/learning-center.mjs';
import {chengyuData,chengyuList,chengyuDetail,markChengyu} from '../app/chengyu.mjs';
test('Chengyu complete source, search, filters, detail, isolated progress and deduplicated XP',async()=>{
 const db=await openDatabase({file:':memory:',url:null});try{await db.migrate();await seed(db,{demo:true});
 const u=await db.get("SELECT * FROM profiles WHERE employee_id='DEMO002'"),other=await db.get("SELECT * FROM profiles WHERE employee_id='DEMO003'");
 const d=chengyuData();assert.equal(d.records.length,2144);assert.equal(new Set(d.records.map(r=>r.uid)).size,2144);assert.equal(d.relations.length,67);
 const r=d.records[0],now=1794400000,learning=new LearningCenter(new Service(db,{demo:true,clock:()=>now}));
 let found=await chengyuList(db,u,new URLSearchParams({q:r.h}));assert(found.rows.some(v=>v.uid===r.uid));assert.equal(found.rows.length<=12,true);
 found=await chengyuList(db,u,new URLSearchParams({q:r.p.normalize('NFD').replace(/\p{M}/gu,'')}));assert(found.rows.some(v=>v.uid===r.uid));
 assert((await chengyuList(db,u,new URLSearchParams({theme:r.themes[0]}))).rows.every(v=>v.themes.includes(r.themes[0])||v.subthemes.includes(r.themes[0])));
 assert((await chengyuDetail(db,u,r.uid)).attribution.includes('Sumber'));
 await markChengyu(db,u,r.uid,'known',now,learning);await markChengyu(db,u,r.uid,'review',now,learning);
 assert.equal((await chengyuDetail(db,u,r.uid)).status,'review');assert.equal((await chengyuDetail(db,other,r.uid)).status,'new');
 assert.equal(Number((await db.get("SELECT SUM(amount) AS n FROM lc_xp WHERE user_id=? AND activity='chengyu_review'",[u.id])).n),2);
 assert.equal((await learning.summary(u)).missions[0].current,1);
 await db.run('INSERT INTO lc_practice(id,user_id,target_id,score,passed,created_at) VALUES(?,?,?,?,?,?)',['test-daily-repeat',u.id,'grammar-repeat',100,1,now]);assert.equal((await learning.summary(u)).missions[1].current,1);
 await assert.rejects(markChengyu(db,u,r.uid,'invalid',now,learning));await assert.rejects(chengyuDetail(db,u,'missing'));
 }finally{await db.close();}
});

test('Chengyu HTTP protects role, CSRF, employee ownership and server-controlled rewards',async()=>{
 const db=await openDatabase({file:':memory:',url:null});await db.migrate();await seed(db,{demo:true});const app=await createApp({db,migrate:false,demo:true,auth:{supabase:false}});await new Promise(r=>app.server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+app.server.address().port;
 const login=async username=>{const r=await fetch(base+'/api/login',{method:'POST',headers:{Origin:base,'Content-Type':'application/json'},body:JSON.stringify({username,password:'DemoMandarin!2026'})});return {cookie:r.headers.get('set-cookie').split(';')[0],...await r.json()};};
 const call=(path,c,body,csrf=true)=>fetch(base+'/api'+path,{method:body?'PUT':'GET',headers:{Cookie:c.cookie,Origin:base,'Content-Type':'application/json',...(csrf?{'X-CSRF-Token':c.csrf}:{})},body:body?JSON.stringify(body):undefined});
 try{assert.equal((await fetch(base+'/api/chengyu')).status,401);const a=await login('DEMO002'),b=await login('DEMO003'),l=await login('LEADER'),uid=chengyuData().records[0].uid;
 assert.equal((await call('/chengyu',l)).status,403);assert.equal((await call('/chengyu/'+uid,a,{status:'known'},false)).status,403);
 assert.equal((await call('/chengyu/'+uid,a,{status:'known',user_id:b.user.id,xp:99999})).status,200);assert.equal((await (await call('/chengyu/'+uid,b)).json()).status,'new');assert.equal(Number((await db.get('SELECT SUM(amount) AS n FROM lc_xp WHERE user_id=?',[a.user.id])).n),2);
 }finally{await new Promise(r=>app.server.close(r));await db.close();}
});
