import test from 'node:test';
import assert from 'node:assert/strict';
import {openDatabase} from '../app/db.mjs';
import {seed} from '../scripts/seed.mjs';
import {Service} from '../app/service.mjs';
import {LearningCenter} from '../app/learning-center.mjs';

test('level-specific dashboard, optional reveal, isolated recall queue and XP retry protection',async()=>{
 const db=await openDatabase({file:':memory:',url:null});await db.migrate();await seed(db,{demo:true});let now=1800000000;
 const service=new Service(db,{demo:true,clock:()=>now}),lc=new LearningCenter(service);
 const u=await db.get("SELECT * FROM profiles WHERE employee_id='DEMO002'"),other=await db.get("SELECT * FROM profiles WHERE employee_id='DEMO003'");
 try{
  const words=await lc.words(u),level=Number(u.placement_level||1),current=words.find(w=>w.track==='hsk'&&Number(w.level)===level),different=words.find(w=>w.track==='hsk'&&Number(w.level)!==level);
  for(const w of [current,different]){const q=await lc.challenge(u,{kind:'card',target:w.id});const result=await lc.submit(u,q.id,{status:'known'});assert(result.saved);await assert.rejects(()=>lc.submit(u,q.id,{status:'known'}),/sudah disimpan/);}
  assert((await lc.summary(u,{view:'center'})).preferences.work_days.length);let summary=await lc.summary(u);assert.equal(summary.level_stats.total,words.filter(w=>w.track==='hsk'&&Number(w.level)===level).length);assert.equal(summary.level_stats.known,1);assert.equal(summary.stats.known,2);assert.equal(summary.xp,4);
  const p=(await service.packages(u)).find(p=>p.track==='hsk'&&p.level===level&&p.word_count);
  assert((await lc.deck(u,{queue:'recall',track:'hsk',level})).words.every(w=>Number(words.find(v=>v.id===w.id).level)===level));
  assert((await lc.deck(u,{queue:'recall'})).words.some(w=>w.id===current.id));assert(!(await lc.deck(other,{queue:'recall'})).words.some(w=>w.id===current.id));
  const r=await lc.challenge(u,{kind:'recall',target:current.id});await assert.rejects(()=>lc.submit(other,r.id,{choice:'0'}),/tidak tersedia/);
  const answer=JSON.parse((await db.get('SELECT answers FROM lc_challenges WHERE id=?',[r.id])).answers).choice;
  assert((await lc.submit(u,r.id,{choice:answer})).correct);assert(!(await lc.deck(u,{queue:'recall'})).words.some(w=>w.id===current.id));
  now+=3601;assert((await lc.deck(u,{queue:'recall'})).words.some(w=>w.id===current.id));
  const recallDeck=await lc.deck(u,{queue:'recall',package:p.id});const packageIds=(await service.package(u,p.id)).words.map(w=>w.id);assert(recallDeck.words.every(w=>packageIds.includes(w.id)));
 }finally{await db.close();}
});
