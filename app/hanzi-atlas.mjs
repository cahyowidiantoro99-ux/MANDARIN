import {readFileSync} from 'node:fs';
import {assert,id,shuffle} from './domain.mjs';
import {learningDay} from './learning-motivation.mjs';

const kind='atlas_pinyin';
let catalog;
export function atlasCatalog(){
  return catalog ??=JSON.parse(readFileSync(new URL('../data/hanzi-atlas.json',import.meta.url),'utf8'));
}

let index;
function words(){
  return index ??=new Map(atlasCatalog().rows.map(row=>[row.hanzi,row]));
}

function questionFor(hanzi,readings){
  const row=words().get(hanzi);
  const wrong=shuffle(readings.filter(value=>!row.pinyin.includes(value))).slice(0,3);
  return {hanzi,options:shuffle([row.pinyin[0],...wrong])};
}

function view(attempt){
  const run=JSON.parse(attempt.payload);
  const {questions,results,score,xp}=run;
  const answered=results.length;
  return {
    id:attempt.id, package:Number(attempt.target_id)||null, answered, total:questions.length, score, xp,
    question:questions[answered]||null, last:results.at(-1)||null,
  };
}

async function owned(db,user,attempt){
  const row=await db.get('SELECT * FROM lc_challenges WHERE id=? AND user_id=? AND kind=?',[attempt,user.id,kind]);
  assert(row,404,'Sesi Latihan Pinyin tidak ditemukan.');
  return row;
}

function stateFrom(row){
  const state=JSON.parse(row?.state||'{}');
  return {...state,best:state.best||{},mistakes:state.mistakes||{},latest:state.latest||{}};
}

export async function atlasProgress(db,user){
  const {best,mistakes}=stateFrom(await db.get('SELECT state FROM atlas_progress WHERE user_id=?',[user.id]));
  return {best,mistakes};
}

export async function updateUser(db,user,run){
  // The upsert locks the account row before reading score and mistake state.
  // PostgreSQL SERIALIZABLE can reject the competing transaction. Retry its whole unit of work.
  for(let retry=0;;retry++){
    try{
      return await db.tx(async t=>{
        await t.run('INSERT INTO atlas_progress(user_id) VALUES(?) ON CONFLICT(user_id) DO UPDATE SET user_id=excluded.user_id',[user.id]);
        const state=stateFrom(await t.get('SELECT state FROM atlas_progress WHERE user_id=?',[user.id]));
        const result=await run(t,state);
        await t.run('UPDATE atlas_progress SET state=? WHERE user_id=?',[JSON.stringify(state),user.id]);
        return result;
      });
    }catch(error){
      if(error.code!=='40001'||retry>=3)throw error;
    }
  }
}

export async function startAtlas(db,user,input,now){
  const pack=input.package===null?null:input.package;
  assert(pack===null||Number.isInteger(pack)&&pack>=1&&pack<=30,400,'Pilih paket 1–30.');
  return updateUser(db,user,async(t,state)=>{
    const key=pack===null?'review':String(pack);
    const previous=state.latest[key];
    if(previous&&!input.restart){
      const row=await owned(t,user,previous.id);
      if(!row.submitted)return view(row);
    }
    const items=pack===null?Object.keys(state.mistakes).filter(hanzi=>state.mistakes[hanzi].active&&words().has(hanzi)):
      atlasCatalog().rows.slice((pack-1)*100,pack*100).map(row=>row.hanzi);
    assert(items.length,409,'Tidak ada kesalahan aktif untuk diulang.');
    const queue=shuffle(items);
    if(queue.length>1&&queue[0]===previous?.first)[queue[0],queue[1]]=[queue[1],queue[0]];
    const readings=[...new Set(atlasCatalog().rows.flatMap(row=>row.pinyin))];
    const session=id(), payload=JSON.stringify({questions:queue.map(hanzi=>questionFor(hanzi,readings)),results:[],score:0,xp:0});
    await t.run('INSERT INTO lc_challenges(id,user_id,kind,target_id,payload,answers,created_at) VALUES(?,?,?,?,?,?,?)',[session,user.id,kind,key,payload,'{}',now]);
    state.latest[key]={id:session,first:queue[0]};
    return view({id:session,target_id:key,payload});
  });
}

export async function getAtlasAttempt(db,user,attempt){
  return view(await owned(db,user,attempt));
}

export async function answerAtlas(db,user,attempt,{index:ordinal,choice},now){
  assert(Number.isInteger(ordinal)&&ordinal>=0&&typeof choice==='string',400,'Jawaban tidak valid.');
  return updateUser(db,user,async(t,state)=>{
    const row=await owned(t,user,attempt), run=JSON.parse(row.payload);
    // A retry or competing tab can read the recorded result, never replace it.
    if(ordinal<run.results.length)return view(row);
    assert(!row.submitted&&ordinal===run.results.length,409,'Soal sudah berubah. Muat ulang sesi.');
    const question=run.questions[ordinal];
    assert(question?.options.includes(choice),400,'Pilihan pinyin tidak valid.');
    const word=words().get(question.hanzi),correct=word.pinyin.includes(choice);
    run.score+=Number(correct);
    run.results.push({hanzi:word.hanzi,choice,correct});
    const mistake=state.mistakes[word.hanzi];
    if(!correct)state.mistakes[word.hanzi]={count:(mistake?.count||0)+1,active:true,answer:choice,wrong_at:now,repaired_at:mistake?.repaired_at??null};
    else if(row.target_id==='review'&&mistake?.active)state.mistakes[word.hanzi]={...mistake,active:false,repaired_at:now};
    const completed=run.results.length===run.questions.length;
    if(completed&&row.target_id!=='review'){
      const best=state.best[row.target_id]||0;
      run.xp=Math.max(0,run.score-best);
      state.best[row.target_id]=Math.max(best,run.score);
      await t.run('INSERT INTO lc_activity_results(id,user_id,kind,target_id,score,completed,created_at) VALUES(?,?,?,?,?,1,?)',[attempt,user.id,kind,row.target_id,run.score,now]);
      // The existing ledger limits one transaction to 15 XP. Chunks retain the actual WITA day.
      for(let i=0;i<run.xp;i+=15)await t.run('INSERT INTO lc_xp(user_id,day,activity,target_id,amount,created_at) VALUES(?,?,?,?,?,?)',[user.id,learningDay(now),kind,attempt+':'+i,Math.min(15,run.xp-i),now]);
    }
    const payload=JSON.stringify(run);
    await t.run('UPDATE lc_challenges SET payload=?,submitted=? WHERE id=? AND user_id=?',[payload,Number(completed),attempt,user.id]);
    return view({...row,payload});
  });
}
