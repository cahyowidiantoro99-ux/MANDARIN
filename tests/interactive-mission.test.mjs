import test from 'node:test';
import assert from 'node:assert/strict';
import {openDatabase} from '../app/db.mjs';
import {seed} from '../scripts/seed.mjs';
import {id} from '../app/domain.mjs';
import {interactiveMission} from '../app/learning-motivation.mjs';
import {learningOverview} from '../public/learning-center.js';
test('optional bonus never blocks completion of three core missions',()=>{const d={level:1,stats:{due:0,total:10,studied:0,known:0,review:0,unknown:0,proven:0},grammar:[],daily:{xp:0,seconds:0},xp:0,learning:{seconds:0,sessions:0},motivation:{streak:0},missions:[{title:'Review',current:10,target:10},{title:'Grammar',current:1,target:1},{title:'Recall',current:3,target:3}],bonus:{current:0,target:1,href:'#practice/bonus'}};const html=learningOverview(d,String);assert(html.includes('✓ Misi inti hari ini selesai'));assert(html.includes('✨ Bonus opsional'));assert(html.includes('0/1'));});
test('interactive bonus uses employee-owned valid results, WITA day, and never grants XP',async()=>{
 const db=await openDatabase({file:':memory:',url:null});try{await db.migrate();await seed(db,{demo:true});const n=Date.parse('2026-11-05T01:00:00+08:00')/1000,start=n-3600,u=await db.get("SELECT * FROM profiles WHERE employee_id='DEMO002'"),v=await db.get("SELECT * FROM profiles WHERE employee_id='DEMO003'"),before=Number((await db.get('SELECT COUNT(*) AS n FROM lc_xp')).n);
 const add=(uid,kind,score,completed,at)=>db.run('INSERT INTO lc_activity_results(id,user_id,kind,target_id,score,completed,created_at) VALUES(?,?,?,?,?,?,?)',[id(),uid,kind,id(),score,completed,at]);
 await add(v.id,'matching',100,1,n);await add(u.id,'matching',100,1,start-1);await add(u.id,'listening',79,1,n);await add(u.id,'story',100,0,n);await add(u.id,'sentence',100,1,n+1);assert.equal((await interactiveMission(db,u.id,n)).current,0);
 for(const kind of ['matching','sentence','listening','story','contrast']){await db.run('DELETE FROM lc_activity_results WHERE user_id=?',[u.id]);await add(u.id,kind,80,1,start);const b=await interactiveMission(db,u.id,n);assert.equal(b.current,1);assert.equal(b.optional,true);assert.equal(b.day,'2026-11-05');await add(u.id,kind,100,1,n);assert.equal((await interactiveMission(db,u.id,n)).current,1);assert.equal((await interactiveMission(db,u.id,start+86400)).current,0);}
 assert.equal(Number((await db.get('SELECT COUNT(*) AS n FROM lc_xp')).n),before);
 }finally{await db.close();}
});
