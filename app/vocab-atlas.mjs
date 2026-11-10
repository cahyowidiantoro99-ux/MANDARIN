import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {assert,id,shuffle} from './domain.mjs';
import {updateUser} from './hanzi-atlas.mjs';

const kind='atlas_vocab_pairs';
const normalize=value=>String(value??'').toLowerCase().normalize('NFD').replace(/u\u0308/g,'v').replace(/\p{M}/gu,'');
let cache;

export function vocabularyAtlas(){
  if(cache)return cache;
  const data=JSON.parse(readFileSync(new URL('../data/vocab-atlas.json',import.meta.url),'utf8'));
  const bands=new Map(), examples=new Map(), links=new Set(), related=new Map();
  data.words.forEach(([hanzi,,level],i)=>{
    for(const word of hanzi.split('|')){
      if(!bands.has(word))bands.set(word,new Set());
      bands.get(word).add(level);
      const example=data.examples[i];
      if(example?.[0].includes(word)&&!examples.has(word))examples.set(word,example);
    }
  });
  const wordInfo=word=>{
    const [pinyin,meaning]=data.aliases[word]||data.supplemental[word]||[];
    return {hanzi:word,pinyin:pinyin||data.extraPinyin[word]||'',meaning:meaning||''};
  };
  const pairCard=([type,a,b,context,note],curated)=>{
    const key=[a,b].sort().join('|');
    const joint=data.joint[key];
    for(const [from,to] of [[a,b],[b,a]]){
      links.add(from);
      const k=type+from;
      if(!related.has(k))related.set(k,new Set());
      related.get(k).add(to);
    }
    const contextReading=[...new Set(context.match(/\p{Script=Han}+/gu)||[])].map(w=>data.contextPinyin[w]).filter(Boolean).join(' / ');
    return {id:createHash('sha256').update(type+'|'+key).digest('hex').slice(0,24),type,words:[wordInfo(a),wordInfo(b)],context,note,contextReading,curated,joint:!!joint,examples:joint?[joint]:[examples.get(a),examples.get(b)].filter(Boolean),levels:[...new Set([...bands.get(a)||[],...bands.get(b)||[]])]};
  };
  const curated=data.curated.map(row=>pairCard(row,true));
  const pairs=[...curated,...data.candidates.map(row=>pairCard(row,false))];
  const words=data.words.map(([hanzi,pinyin,level,,meaning],i)=>({bookmark_id:createHash('sha256').update(level+'|'+hanzi).digest('hex').slice(0,24),hanzi,pinyin,level,meaning,example:data.examples[i],link:hanzi.split('|').find(w=>links.has(w))}));
  const pools=Object.fromEntries(['S','A'].map(type=>[type,[...new Set(curated.filter(p=>p.type===type).flatMap(p=>p.words.map(w=>w.hanzi)))]]));
  return cache={words,pairs,curated,banks:data.banks,examContext:data.examContext,related,pools,byId:new Map(curated.map(p=>[p.id,p])),
    wordSearch:words.map(w=>normalize([w.hanzi,w.pinyin,w.meaning].join(' '))),
    pairSearch:pairs.map(p=>normalize([...p.words.flatMap(w=>[w.hanzi,w.pinyin,w.meaning]),p.context,p.note].join(' ')))};
}

export function vocabularyList(params){
  const {words,pairs,wordSearch,pairSearch}=vocabularyAtlas();
  const pairMode=params.get('view')==='pairs';
  const source=pairMode?pairs:words, index=pairMode?pairSearch:wordSearch;
  const tokens=normalize((params.get('q')||'').slice(0,150)).trim().split(/\s+/).filter(Boolean);
  const type=params.get('type'),level=params.get('level'),exact=params.get('word');
  const found=source.filter((row,i)=> (!level||(pairMode?row.levels.includes(level):row.level===level))&&
    (!pairMode||((!type||row.type===type)&&(!exact||row.words.some(w=>w.hanzi===exact))))&&tokens.every(t=>index[i].includes(t)));
  const page=Math.max(0,Math.min(Math.ceil(found.length/24)-1,Number.parseInt(params.get('page'),10)||0));
  return {page,total:found.length,rows:found.slice(page*24,page*24+24)};
}

function question(pair,reverse,atlas,index){
  const from=pair.words[reverse?1:0], to=pair.words[reverse?0:1].hanzi;
  const distractors=atlas.pools[pair.type].filter(w=>w!==from.hanzi&&w!==to&&!atlas.related.get(pair.type+from.hanzi)?.has(w)&&!w.includes(from.hanzi)&&!from.hanzi.includes(w));
  const contexts=pair.context.split('／');
  const contextual=atlas.examContext[index];
  const raw=contexts.length>1?[contextual,contexts[reverse?0:1]].filter(Boolean).join(' · '):contextual||[pair.context,pair.note].filter(Boolean).join(' · ');
  const clue=raw.replaceAll(to,'___');
  return {pairId:pair.id,type:pair.type,contextual:!!contextual,from,to,clue,options:shuffle([to,...shuffle(distractors).slice(0,3)])};
}

function view(row){
  const {questions,results,score}=JSON.parse(row.payload);
  const q=questions[results.length];
  const {to,...visible}=q||{};
  const last=results.at(-1);
  return {id:row.id,total:questions.length,answered:results.length,score,question:q?visible:null,last:last?{...last,pair:vocabularyAtlas().byId.get(last.pairId)}:null};
}

export async function startVocabulary(db,user,input,now){
  const atlas=vocabularyAtlas();
  const {mode,bank,type,level}=input;
  assert(['bank','quick','review'].includes(mode),400,'Pilih jenis latihan.');
  assert(mode!=='bank'||Number.isInteger(bank)&&bank>=1&&bank<=10,400,'Pilih Bank 1–10.');
  const key=mode==='bank'?'bank-'+bank:mode;
  return updateUser(db,user,async(t,state)=>{
    const progress=state.vocabulary??={mistakes:{},latest:{}};
    const previous=progress.latest[key]?await t.get('SELECT payload FROM lc_challenges WHERE id=? AND user_id=? AND kind=?',[progress.latest[key],user.id,kind]):null;
    const old=previous?JSON.parse(previous.payload).questions:[];
    const previousByPair=new Map(old.map(q=>[q.pairId,q]));
    let indices=mode==='bank'?atlas.banks[bank-1]:atlas.curated.flatMap((p,i)=>
      (mode==='review'?progress.mistakes[p.id]?.active:(!type||p.type===type)&&(!level||p.levels.includes(level)))?[i]:[]);
    indices=shuffle(indices).slice(0,mode==='bank'?undefined:10);
    assert(indices.length,409,'Belum ada soal untuk pilihan ini.');
    if(indices.length>1&&atlas.curated[indices[0]].id===old[0]?.pairId)[indices[0],indices[1]]=[indices[1],indices[0]];
    const questions=indices.map((i,position)=>{
      const pair=atlas.curated[i],previousQuestion=previousByPair.get(pair.id);
      return question(pair,position===0&&previousQuestion?previousQuestion.from.hanzi===pair.words[0].hanzi:Math.random()<.5,atlas,i);
    });
    const session=id(),payload=JSON.stringify({questions,results:[],score:0});
    await t.run('INSERT INTO lc_challenges(id,user_id,kind,target_id,payload,answers,created_at) VALUES(?,?,?,?,?,?,?)',[session,user.id,kind,key,payload,'{}',now]);
    progress.latest[key]=session;
    return view({id:session,payload});
  });
}

export async function vocabularyMistakes(db,user){
  const row=await db.get('SELECT state FROM atlas_progress WHERE user_id=?',[user.id]);
  return Object.entries(JSON.parse(row?.state||'{}').vocabulary?.mistakes||{}).flatMap(([key,value])=>{
    const pair=vocabularyAtlas().byId.get(key);
    return pair?[{...value,pair}]:[];
  }).sort((a,b)=>b.wrongAt-a.wrongAt);
}

export async function answerVocabulary(db,user,attempt,{index,choice},now){
  assert(Number.isInteger(index)&&index>=0&&typeof choice==='string',400,'Jawaban tidak valid.');
  return updateUser(db,user,async(t,state)=>{
    const row=await t.get('SELECT * FROM lc_challenges WHERE id=? AND user_id=? AND kind=?',[attempt,user.id,kind]);
    assert(row,404,'Sesi latihan tidak ditemukan.');
    const run=JSON.parse(row.payload),q=run.questions[index];
    if(index<run.results.length)return view(row);
    assert(index===run.results.length&&q?.options.includes(choice),400,'Pilihan jawaban tidak valid.');
    const correct=q.to===choice;
    const mistakes=state.vocabulary.mistakes,mistake=mistakes[q.pairId];
    if(!correct)mistakes[q.pairId]={count:(mistake?.count||0)+1,active:true,choice,wrongAt:now,repairedAt:mistake?.repairedAt??null};
    else if(mistake?.active)mistakes[q.pairId]={...mistake,active:false,repairedAt:now};
    run.score+=Number(correct);
    run.results.push({correct,choice,answer:q.to,pairId:q.pairId});
    const payload=JSON.stringify(run);
    await t.run('UPDATE lc_challenges SET payload=?,submitted=? WHERE id=? AND user_id=?',[payload,Number(run.results.length===run.questions.length),attempt,user.id]);
    return view({...row,payload});
  });
}
