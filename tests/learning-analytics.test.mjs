import test from 'node:test';
import assert from 'node:assert/strict';
import {openDatabase} from '../app/db.mjs';
import {seed} from '../scripts/seed.mjs';
import {Service} from '../app/service.mjs';
import {LearningCenter} from '../app/learning-center.mjs';
import {learningAnalytics,scheduledDays} from '../app/learning-analytics.mjs';
import {id,periodBounds} from '../app/domain.mjs';

test('Learning analytics batches queries, scopes mastery, separates official scores and excludes unfinished days',async()=>{
 const db=await openDatabase({file:':memory:',url:null});await db.migrate();await seed(db,{demo:true});const now=Date.parse('2026-11-05T12:00:00+08:00')/1000,s=new Service(db,{demo:true,clock:()=>now});
 try{
 const u=await db.get("SELECT * FROM profiles WHERE employee_id='DEMO002'"),leader=await db.get("SELECT * FROM profiles WHERE role='leader'");await db.run('UPDATE profiles SET placement_level=1,created_at=? WHERE id=?',[now-30*86400,u.id]);
 await assert.rejects(()=>learningAnalytics(s,u),/Leader/);await assert.rejects(()=>learningAnalytics(s,leader,{at:'nonsense'}),/Tanggal/);
 const lc=new LearningCenter(s),word=(await lc.words(u)).find(w=>w.track==='hsk'&&Number(w.level)===1);
 await db.run('INSERT INTO vocabulary_progress(user_id,vocabulary_id,status,updated_at) VALUES(?,?,?,?)',[u.id,word.id,'known',now]);
 let d=await learningAnalytics(s,leader,{q:u.name});assert.equal(d.employees.length,1);assert.equal(d.employees[0].hsk.proven,0);assert.equal(d.employees[0].hsk.studied,1);assert.equal(d.employees[0].official_hsk,null);
 await db.run('INSERT INTO lc_review_state(user_id,vocabulary_id,due_at,interval_seconds,repetitions,recall_successes,last_correct,reviewed_at) VALUES(?,?,?,?,?,?,?,?)',[u.id,word.id,now+10,86400,2,2,1,now]);
 const day='2026-11-03',time=Date.parse(day+'T12:00:00+08:00')/1000;for(const [activity,count] of [['review',10],['grammar',1],['recall',3]])for(let i=0;i<count;i++)await db.run('INSERT INTO lc_xp(user_id,day,activity,target_id,amount,created_at) VALUES(?,?,?,?,?,?)',[u.id,day,activity,id(),2,time]);
 await db.run('INSERT INTO lc_activity_results(id,user_id,kind,target_id,score,completed,created_at) VALUES(?,?,?,?,?,?,?)',[id(),u.id,'matching','fixture',60,0,time]);
 const original=db.all.bind(db);let calls=0;db.all=async(...a)=>{calls++;return original(...a);};d=await learningAnalytics(s,leader,{q:u.name});assert.equal(calls,9);assert.equal(d.employees[0].hsk.proven,1);assert.equal(d.employees[0].scheduled_days,3);assert.equal(d.employees[0].missions_done,3);assert.equal(d.employees[0].missions_total,9);assert.equal(d.employees[0].practice_average,60);assert.equal(d.employees[0].official_hsk,null);assert.equal(d.trends[0].practice,60);
 calls=0;await learningAnalytics(s,leader);assert.equal(calls,9,'query count does not grow with employee count');
 assert.equal((await learningAnalytics(s,leader,{department:'NO-SUCH-DEPT'})).employees.length,0);assert.equal((await learningAnalytics(s,leader,{at:now-90*86400})).kpi.active,0);
 const rec=(await lc.summary({...u,placement_level:1})).recommendations;assert(rec.some(r=>r.href==='#practice'));assert(rec.every(r=>r.reason&&r.href.startsWith('#')));const before=await db.get('SELECT COUNT(*) AS n FROM lc_xp');for(let i=0;i<250;i++)await db.run('INSERT INTO profiles(id,employee_id,name,email,department,division,job_title,role,self_level,placement_level,demo,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)',[id(),'BENCH'+i,'Synthetic performance '+i,'bench'+i+'@example.invalid',u.department,'QA','QA','employee',1,1,1,now-864000]);calls=0;const started=performance.now();const large=await learningAnalytics(s,leader);console.log('Analytics synthetic cohort:',large.employees.length,'employees,',calls,'queries,',Math.round(performance.now()-started),'ms');assert.equal(calls,9);assert(large.employees.length>=250);assert.equal((await db.get('SELECT COUNT(*) AS n FROM lc_xp')).n,before.n);
 }finally{await db.close();}
});
test('Scheduled learning days respect personal shifts, holidays and account creation',()=>{
 const start=periodBounds('weekly',Date.parse('2026-11-05T12:00:00+08:00')/1000).start;
 const p={created_at:start+86400},prefs={work_days:'[1,2,3,4,5]',rest_dates:'["2026-11-04"]'};
 assert.deepEqual(scheduledDays(p,prefs,start,start+5*86400),['2026-11-03','2026-11-05','2026-11-06']);
});
