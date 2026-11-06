import test from 'node:test';
import assert from 'node:assert/strict';
import {openDatabase} from '../app/db.mjs';
import {seed} from '../scripts/seed.mjs';
import {atlasProgress} from '../app/hanzi-atlas.mjs';
import {vocabularyAtlas,vocabularyList,startVocabulary,answerVocabulary,vocabularyMistakes} from '../app/vocab-atlas.mjs';

test('catalog coverage, paginated search and exact bank partitions',()=>{
  const atlas=vocabularyAtlas();
  assert.equal(atlas.words.length,11092);
  assert(atlas.words.every(w=>w.example?.length===3));
  assert.equal(atlas.pairs.length,10276);
  assert.deepEqual(atlas.banks.map(b=>b.length),[37,37,37,37,37,37,37,37,37,36]);
  assert.deepEqual([...new Set(atlas.banks.flat())].sort((a,b)=>a-b),Array.from({length:369},(_,i)=>i));
  assert.equal(atlas.byId.size,369);
  assert.equal(vocabularyList(new URLSearchParams()).rows.length,24);
  for(const q of ['爱好','aihao','hobi']){
    const result=vocabularyList(new URLSearchParams({q,level:'1'}));
    assert(result.rows.some(w=>w.hanzi==='爱好'));
    assert(result.rows.every(w=>w.level==='1'));
  }
  const pairs=vocabularyList(new URLSearchParams({view:'pairs',word:'提高',level:'3',type:'A'}));
  assert(pairs.total>0);
  assert(pairs.rows.every(p=>p.levels.includes('3')&&p.type==='A'&&p.words.some(w=>w.hanzi==='提高')));
});

test('quiz directions, four unique options, feedback and account-scoped mistakes',async()=>{
  const db=await openDatabase({file:':memory:',url:null});
  try{
    await db.migrate();await seed(db,{demo:true});
    const user=await db.get("SELECT * FROM profiles WHERE employee_id='DEMO002'");
    const other=await db.get("SELECT * FROM profiles WHERE employee_id='DEMO003'");
    const atlas=vocabularyAtlas(),now=1793850000;
    const run=(mode,opts={})=>startVocabulary(db,user,{mode,...opts},now);
    const payload=async r=>JSON.parse((await db.get('SELECT payload FROM lc_challenges WHERE id=?',[r.id])).payload);
    for(let bank=1;bank<=10;bank++){
      const first=await payload(await run('bank',{bank}));
      const next=await payload(await run('bank',{bank}));
      assert.equal(first.questions.length,bank===10?36:37);
      assert.notEqual(first.questions[0].pairId,next.questions[0].pairId);
      assert.notEqual(next.questions[0].from.hanzi,first.questions.find(x=>x.pairId===next.questions[0].pairId).from.hanzi);
      for(const q of next.questions){
        assert.equal(new Set(q.options).size,4);

      }
    }
    let quiz=await run('quick',{type:'A',level:'3'});
    assert(quiz.total<=10);
    const q=quiz.question,p=atlas.byId.get(q.pairId),wrong=q.options.find(x=>!p.words.some(w=>w.hanzi===x));
    assert(p.levels.includes('3')&&p.type==='A');
    await assert.rejects(answerVocabulary(db,other,quiz.id,{index:0,choice:wrong},now),/tidak ditemukan/);
    const answered=await answerVocabulary(db,user,quiz.id,{index:0,choice:wrong},now);
    assert.equal(answered.last.correct,false);
    assert.deepEqual(answered.last.pair,p);
    await answerVocabulary(db,user,quiz.id,{index:0,choice:wrong},now);
    assert.equal((await vocabularyMistakes(db,user))[0].count,1);
    assert.deepEqual(await vocabularyMistakes(db,other),[]);
    const review=await run('review');
    const correct=p.words.find(w=>w.hanzi!==review.question.from.hanzi).hanzi;
    const done=await answerVocabulary(db,user,review.id,{index:0,choice:correct},now+1);
    assert.equal(done.score,1);
    assert.equal(done.question,null);
    assert.equal((await vocabularyMistakes(db,user))[0].active,false);
    assert.deepEqual(await atlasProgress(db,user),{best:{},mistakes:{}});
  }finally{await db.close();}
});
