import test from 'node:test';
import assert from 'node:assert/strict';
import {openDatabase} from '../app/db.mjs';
import {seed} from '../scripts/seed.mjs';
import {Service} from '../app/service.mjs';
import {LearningCenter} from '../app/learning-center.mjs';
import {id} from '../app/domain.mjs';
test('dashboard summary isolates daily XP and active sessions by employee and WITA day',async()=>{
 const db=await openDatabase({file:':memory:',url:null});try{await db.migrate();await seed(db,{demo:true});const n=Date.parse('2026-11-05T01:00:00+08:00')/1000,start=Date.parse('2026-11-05T00:00:00+08:00')/1000,u=await db.get("SELECT * FROM profiles WHERE employee_id='DEMO002'"),v=await db.get("SELECT * FROM profiles WHERE employee_id='DEMO003'"),p=await db.get("SELECT * FROM learning_packages WHERE track='hsk' AND level=1 ORDER BY ordinal LIMIT 1");await db.run('UPDATE learning_packages SET demo=1 WHERE id=?',[p.id]);await db.run('DELETE FROM lc_xp');await db.run('DELETE FROM learning_session_metadata');await db.run('DELETE FROM learning_sessions');
 for(const [uid,day,amount] of [[u.id,'2026-11-05',2],[u.id,'2026-11-04',3],[v.id,'2026-11-05',9]])await db.run('INSERT INTO lc_xp(user_id,day,activity,target_id,amount,created_at) VALUES(?,?,?,?,?,?)',[uid,day,'review',id(),amount,n]);
 for(const [uid,at,seconds] of [[u.id,start+1,90],[u.id,start-1,120],[v.id,start+1,900]])await db.run('INSERT INTO learning_sessions(id,user_id,package_id,started_at,last_heartbeat,active_seconds) VALUES(?,?,?,?,?,?)',[id(),uid,p.id,at,at+seconds,seconds]);
 const lc=new LearningCenter(new Service(db,{demo:true,clock:()=>n})),d=await lc.summary(u);assert.equal(d.daily.xp,2);assert.equal(d.xp,5);assert.equal(d.daily.seconds,90);assert.equal(Number(d.learning.seconds),210);assert.equal(d.resume.href,'#study/package-'+p.id);assert.equal(d.stats.total-d.stats.studied,d.stats.total-d.stats.known-d.stats.review-d.stats.unknown);assert.equal((await db.get('SELECT COUNT(*) AS n FROM lc_xp')).n,3);
 }finally{await db.close();}
});
