import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {openDatabase} from '../app/db.mjs';
import {seed} from '../scripts/seed.mjs';
import {atlasCatalog,atlasProgress,startAtlas,answerAtlas,getAtlasAttempt} from '../app/hanzi-atlas.mjs';

test('Atlas matches source and partitions every character exactly once',()=>{
  const html=existsSync('Atlas_Hanzi_HSK_1-9.html')?readFileSync('Atlas_Hanzi_HSK_1-9.html','utf8'):null;
  const data=atlasCatalog();
  if(html)for(const name of ['rows','curatedShapes','scannedShapes','compareMeaning','compareModes']){
    const raw=html.match(new RegExp('const '+name+'\\s*=\\s*(.+);'))[1];
    assert.deepEqual(data[name],JSON.parse(raw));
  }
  const packs=Array.from({length:30},(_,i)=>data.rows.slice(i*100,i*100+100));
  assert(packs.every(p=>p.length===100));
  assert.equal(new Set(packs.flat().map(r=>r.hanzi)).size,3000);
  const keys=new Set(data.rows.map(r=>r.hanzi));
  assert([...data.curatedShapes,...data.scannedShapes].every(([g])=>[...g].every(c=>keys.has(c))));
});

test('Atlas persists account-scoped answers and grants only improvements, including competing final submissions',async()=>{
  const db=await openDatabase({file:':memory:',url:null});
  try{
    await db.migrate();await seed(db,{demo:true});
    const u=await db.get("SELECT * FROM profiles WHERE employee_id='DEMO002'");
    const other=await db.get("SELECT * FROM profiles WHERE employee_id='DEMO003'");
    const now=1793850000, key=new Map(atlasCatalog().rows.map(r=>[r.hanzi,r.pinyin]));
    const choice=(q,correct)=>q.options.find(x=>key.get(q.hanzi).includes(x)===correct);
    const ledger=async()=>Number((await db.get("SELECT COALESCE(SUM(amount),0) AS n FROM lc_xp WHERE user_id=? AND activity='atlas_pinyin'",[u.id])).n);
    async function complete(run,score){
      const seen=new Set();
      while(run.question){
        const {id,answered,question}=run;
        assert(!seen.has(question.hanzi));seen.add(question.hanzi);
        assert.equal(new Set(question.options).size,4);
        assert.equal(question.options.filter(x=>key.get(question.hanzi).includes(x)).length,1);
        const body={index:answered,choice:choice(question,answered<score)};
        if(answered===99){
          const [a,b]=await Promise.all([answerAtlas(db,u,id,body,now),answerAtlas(db,u,id,body,now)]);
          assert.deepEqual(a,b);run=a;
        }else run=await answerAtlas(db,u,id,body,now);
      }
      assert.equal(run.score,score);assert.equal(seen.size,100);
      assert.deepEqual(seen,new Set(atlasCatalog().rows.slice(0,100).map(r=>r.hanzi)));
      return run;
    }
    let first=await startAtlas(db,u,{package:1},now);
    await assert.rejects(()=>getAtlasAttempt(db,other,first.id),/tidak ditemukan/);
    await assert.rejects(()=>answerAtlas(db,other,first.id,{index:0,choice:first.question.options[0]},now),/tidak ditemukan/);
    assert.equal((await startAtlas(db,u,{package:1},now)).id,first.id);
    assert.equal(await ledger(),0);
    const original=first.question.hanzi;
    assert.equal((await complete(first,70)).xp,70);
    assert.equal(await ledger(),70);
    first=await startAtlas(db,u,{package:1},now+86400);
    assert.notEqual(first.question.hanzi,original);
    assert.equal((await complete(first,82)).xp,12);
    assert.equal(await ledger(),82);
    const lower=await startAtlas(db,u,{package:1},now+86400);
    assert.equal((await complete(lower,75)).xp,0);
    assert.equal(await ledger(),82);
    assert.equal((await atlasProgress(db,u)).best[1],82);
    assert.deepEqual((await atlasProgress(db,other)).mistakes,{});
    const review=await startAtlas(db,u,{package:null},now);
    const repaired=review.question.hanzi;
    await answerAtlas(db,u,review.id,{index:0,choice:choice(review.question,true)},now);
    const entry=(await atlasProgress(db,u)).mistakes[repaired];
    assert.equal(entry.active,false);assert.equal(entry.repaired_at,now);assert(entry.count>0);
    assert.equal(await ledger(),82);
    const tabs=await Promise.all([startAtlas(db,u,{package:2,restart:true},now),startAtlas(db,u,{package:2,restart:true},now)]);
    async function finalAnswer(run,score){
      while(run.answered<99)run=await answerAtlas(db,u,run.id,{index:run.answered,choice:choice(run.question,run.answered<score)},now);
      return {id:run.id,body:{index:99,choice:choice(run.question,false)}};
    }
    const pending=await Promise.all(tabs.map((run,i)=>finalAnswer(run,75+i*10)));
    const results=await Promise.all(pending.map(({id,body})=>answerAtlas(db,u,id,body,now)));
    assert.equal(results.reduce((sum,result)=>sum+result.xp,0),85);
    assert.equal((await atlasProgress(db,u)).best[2],85);
    assert.equal(await ledger(),167);
  }finally{await db.close();}
});
