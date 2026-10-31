import {assert,shuffle} from './domain.mjs';
export const concept=q=>q.concept_key||q.id;
/** Select unique learning concepts, balancing the requested skills, then least-exposed concepts.
 * Last two attempts and the previous week are excluded when enough fresh concepts remain.
 */
export function selectQuestions(rows,count,{used=[],excluded=new Set(),mode='random30',track='hsk'}={}){
 const unique=new Map();for(const r of shuffle(rows))if(!excluded.has(concept(r))&&!unique.has(concept(r)))unique.set(concept(r),r);
 assert(unique.size>=count,409,`Pool materi unik tidak cukup: tersedia ${unique.size}, diperlukan ${count}. Tidak ada kosakata atau pola yang digandakan.`);
 const frequency=new Map(),recent=new Set(used.filter(r=>r.recent).map(r=>r.concept_key));for(const r of used)frequency.set(r.concept_key,(frequency.get(r.concept_key)||0)+1);
 const concepts=new Set(rows.filter(r=>!excluded.has(concept(r))).map(concept));const fresh=new Set([...concepts].filter(c=>!recent.has(c)));
 let candidates=shuffle(rows.filter(r=>!excluded.has(concept(r))&&(fresh.size>=count?fresh.has(concept(r)):true)));
 candidates.sort((a,b)=>Number(recent.has(concept(a)))-Number(recent.has(concept(b)))||(frequency.get(concept(a))||0)-(frequency.get(concept(b))||0));
 const chosen=[],seen=new Set(excluded);
 const take=(matches,n)=>{for(const r of candidates){if(n<=0)break;const key=concept(r);if(!seen.has(key)&&matches(r)){chosen.push(r);seen.add(key);n--;}}};
 if(!['grammar','translation'].includes(mode)){
  // Grammar + contextual comprehension prevent a high level from becoming a basic pinyin-only quiz.
  const plan=track==='hsk'
   ? ['placement','weekly'].includes(mode)?{grammar:Math.floor(count*.2),context:Math.floor(count*.4),translation:count-Math.floor(count*.2)-Math.floor(count*.4)}
     : {grammar:Math.floor(count*.2),context:Math.floor(count*.35),pinyin:Math.floor(count*.1),translation:count-Math.floor(count*.2)-Math.floor(count*.35)-Math.floor(count*.1)}
   : {grammar:Math.floor(count*.2),context:Math.floor(count*.3),translation:Math.floor(count*.4),pinyin:Math.floor(count*.1)};
  for(const[kind,n]of Object.entries(plan))take(q=>q.kind===kind,n);
 }
 take(()=>true,count-chosen.length);
 assert(chosen.length===count,409,'Pool materi unik untuk blueprint ujian belum cukup.');
 if(mode==='translation'){
  for(const direction of ['zh-id','id-zh'])if(!chosen.some(q=>q.direction===direction)){
   const swap=candidates.find(q=>q.direction===direction&&!seen.has(concept(q)));assert(swap,409,'Pool translation dua arah dengan materi unik belum cukup.');chosen[chosen.length-1]=swap;
  }
 }
 chosen.forEach(q=>excluded.add(concept(q)));return shuffle(chosen);
}
