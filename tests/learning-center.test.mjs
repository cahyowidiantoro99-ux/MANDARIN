import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {openDatabase} from '../app/db.mjs';
import {seed} from '../scripts/seed.mjs';
import {Service} from '../app/service.mjs';
import {id} from '../app/domain.mjs';
import {LearningCenter,scheduleReview,masteryProven,grammarContent,themeOf} from '../app/learning-center.mjs';
import {createApp} from '../app/server.mjs';
test('SRS prioritizes unknown, adapts intervals, and self-rating alone is not mastery',()=>{
 const n=1800000000;
 assert.equal(scheduleReview(null,'unknown',null,n).due_at,n+600);
 assert(scheduleReview(null,'review',null,n).due_at<scheduleReview(null,'known',null,n).due_at);
 assert(scheduleReview({interval_seconds:86400},'known',true,n).interval_seconds>86400);
 assert.equal(scheduleReview({recall_successes:3},'known',false,n).recall_successes,0);
 assert(!masteryProven({status:'known'}));assert(masteryProven({status:'known',recall_successes:2,last_correct:1}));
 assert.equal(themeOf({meaning:'perbaikan mesin',hanzi:'维修'}),'repair');
});
test('Learning API enforces sessions, CSRF, employee scope, and consumes a challenge once',async()=>{
 const db=await openDatabase({file:':memory:',url:null});await db.migrate();await seed(db,{demo:true});let n=1800000000;const app=await createApp({db,migrate:false,demo:true,auth:{supabase:false,clock:()=>n},service:{clock:()=>n}});await new Promise(r=>app.server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${app.server.address().port}`;
 const login=async(username)=>{const r=await fetch(base+'/api/login',{method:'POST',headers:{Origin:base,'Content-Type':'application/json'},body:JSON.stringify({username,password:'DemoMandarin!2026'})});return {cookie:r.headers.get('set-cookie').split(';')[0],...(await r.json())};};
 const call=(path,c,{method='GET',body,csrf=true}={})=>fetch(base+'/api'+path,{method,headers:{Cookie:c.cookie,Origin:base,'Content-Type':'application/json',...(csrf?{'X-CSRF-Token':c.csrf}:{})},body:body?JSON.stringify(body):undefined});
 try{
  assert.equal((await fetch(base+'/api/learn/summary')).status,401);const a=await login('DEMO002'),b=await login('DEMO003'),l=await login('LEADER');assert.equal((await call('/learn/summary',l)).status,403);assert.equal((await fetch(base+'/api/leader/learning')).status,401);assert.equal((await call('/leader/learning',a)).status,403);assert.equal((await call('/leader/learning',l)).status,200);assert.equal((await call('/leader/learning',l,{method:'POST',body:{xp:9999}})).status,404);const deck=await (await call('/learn/deck?track=hsk&level=1',a)).json(),word=deck.words[0];
  assert.equal((await call('/learn/challenges',a,{method:'POST',body:{kind:'card',target:word.id},csrf:false})).status,403);
  const challenge=await (await call('/learn/challenges',a,{method:'POST',body:{kind:'card',target:word.id,user_id:b.user.id,xp:999999}})).json();assert(!JSON.stringify(challenge).includes(word.meaning));assert.equal((await call('/learn/challenges/'+challenge.id+'/reveal',b,{method:'POST',body:{}})).status,404);
  assert.equal((await call('/learn/challenges/'+challenge.id+'/reveal',a,{method:'POST',body:{}})).status,200);n+=3;const path='/learn/challenges/'+challenge.id+'/submit';assert.equal((await call(path,a,{method:'POST',body:{status:'unknown',xp:99999}})).status,200);assert.equal((await call(path,a,{method:'POST',body:{status:'unknown'}})).status,409);assert.equal((await (await call('/learn/summary',a)).json()).xp,2);assert.equal((await (await call('/learn/summary',b)).json()).xp,0);assert.equal((await fetch(base+'/learning-center.js')).status,200);assert.equal((await call('/play/catalog',l)).status,403);assert.equal((await call('/play/start',a,{method:'POST',body:{kind:'matching',level:1},csrf:false})).status,403);const game=await (await call('/play/start',a,{method:'POST',body:{kind:'matching',level:1}})).json();n+=15;assert.equal((await call('/play/submit/'+game.id,b,{method:'POST',body:{values:Array(5).fill('bogus')}})).status,404);const bad=await (await call('/play/submit/'+game.id,a,{method:'POST',body:{values:Array(5).fill('bogus'),score:100,xp:9999}})).json();assert.equal(bad.score,0);assert.equal((await (await call('/learn/summary',a)).json()).xp,2);assert.equal((await fetch(base+'/learning-play.js')).status,200);
 }finally{await new Promise(r=>app.server.close(r));await db.close();}
});
test('Learning Center persists review history, protects ownership and deduplicates XP',async()=>{
 const db=await openDatabase({file:':memory:',url:null});await db.migrate();await db.migrate();await seed(db,{demo:true});let now=1800000000;
 const s=new Service(db,{demo:true,clock:()=>now}),lc=new LearningCenter(s),u=await db.get("SELECT * FROM profiles WHERE employee_id='DEMO002'"),b=await db.get("SELECT * FROM profiles WHERE employee_id='DEMO003'"),leader=await db.get("SELECT * FROM profiles WHERE role='leader'");
 try{
 const p=(await s.packages(u)).find(p=>p.track==='hsk'&&p.word_count>0),vid=(await s.package(u,p.id)).words[0].id;
 const q=await lc.challenge(u,{kind:'card',target:vid});assert(!JSON.stringify(q).includes('meaning'));await assert.rejects(()=>lc.submit(u,q.id,{status:'known'}),/Buka jawaban/);await assert.rejects(()=>lc.reveal(b,q.id),/tidak tersedia/);await lc.reveal(u,q.id);now+=3;await lc.submit(u,q.id,{status:'known'});await assert.rejects(()=>lc.submit(u,q.id,{status:'known'}),/sudah disimpan/);
 assert.equal((await lc.summary(u)).xp,2);assert.equal((await lc.summary(b)).xp,0);assert.equal((await lc.summary(u)).stats.proven,0);
 const recall=await lc.challenge(u,{kind:'recall',target:vid});const secret=JSON.parse((await db.get('SELECT answers FROM lc_challenges WHERE id=?',[recall.id])).answers);const r=await lc.submit(u,recall.id,{choice:secret.choice});assert(r.correct);assert.equal((await lc.summary(u)).xp,5);
 now+=11;const q2=await lc.challenge(u,{kind:'card',target:vid});await lc.reveal(u,q2.id);now+=3;await lc.submit(u,q2.id,{status:'review'});assert.equal((await lc.summary(u)).xp,5);assert((await lc.deck(u,{queue:'review'})).words.some(w=>w.id===vid));
 assert.equal((await new LearningCenter(s).deck(u,{queue:'review'})).words.find(w=>w.id===vid).status,'review');await assert.rejects(()=>lc.summary(leader),/Leader/);await assert.rejects(()=>lc.challenge(leader,{kind:'card',target:vid}),/Leader/);
 const forbidden=(await db.get("SELECT v.id FROM vocabulary v JOIN content_versions cv ON cv.id=v.version_id WHERE v.track='work' AND v.department NOT IN ('GENERAL',?) LIMIT 1",[u.department]));if(forbidden)await assert.rejects(()=>lc.challenge(u,{kind:'card',target:forbidden.id}),/tidak tersedia/);
 const grammar=JSON.parse(readFileSync('data/source-release.json')).lessons.find(l=>l.kind==='grammar'),gid=id(),version=(await db.get('SELECT id FROM content_versions WHERE demo=1 LIMIT 1')).id;
 await db.run('INSERT INTO learning_lessons(id,title,track,level,kind,body,source_ref,version_id) VALUES(?,?,?,?,?,?,?,?)',[gid,grammar.title,'hsk',1,'grammar',JSON.stringify(grammar.body),JSON.stringify(grammar.source_ref),version]);assert(grammarContent({...grammar,id:gid}).examples.length>=3);
 const g=await lc.challenge(u,{kind:'grammar',target:gid}),answer=JSON.parse((await db.get('SELECT answers FROM lc_challenges WHERE id=?',[g.id])).answers).values;assert(!('answers'in g));now+=6;assert.equal((await lc.submit(u,g.id,{values:answer})).score,100);assert.equal((await lc.summary(u)).xp,20);
 const again=await lc.challenge(u,{kind:'grammar',target:gid});now+=6;await lc.submit(u,again.id,{values:answer});assert.equal((await lc.summary(u)).xp,20);
 assert((await lc.summary(u)).grammar.find(g=>g.id===gid).completed);assert.equal((await db.get('SELECT COUNT(*) AS n FROM lc_reviews WHERE user_id=?',[u.id])).n,3);
 }finally{await db.close();}
});
