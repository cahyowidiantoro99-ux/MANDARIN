import {assert} from './domain.mjs';
import {id} from './domain.mjs';
import {scheduleReview} from './learning-center.mjs';
export const memoryStates=['known','review','unknown'];
export function packageProgress(row,counts={}){
 const total=Number(row.word_count||0),known=Number(counts.known||0),review=Number(counts.review||0),unknown=Number(counts.unknown||0),reviewed=known+review+unknown;
 const percent=total?Math.round(reviewed/total*100):Number(row.completed)?100:0;
 return {...row,word_count:total,known_count:known,review_count:review,unknown_count:unknown,reviewed_count:reviewed,learning_percent:percent,mastery_percent:total?Math.round(known/total*100):0,study_status:total&&known===total?'mastered':total&&reviewed===total?'studied':reviewed?'in_progress':Number(row.completed)?'session_completed':'not_started'};
}
export async function enrichPackages(db,rows,user,flag){
 const counts=await db.all("SELECT pv.package_id,pr.status,COUNT(*) AS total FROM vocabulary_progress pr JOIN package_vocabulary pv ON pv.vocabulary_id=pr.vocabulary_id JOIN vocabulary v ON v.id=pr.vocabulary_id JOIN content_versions cv ON cv.id=v.version_id WHERE pr.user_id=? AND cv.status='published' AND cv.demo=? AND (v.track='hsk' OR v.department IN ('GENERAL',?)) GROUP BY pv.package_id,pr.status",[user.id,flag,user.department]);
 return rows.map(row=>packageProgress(row,Object.fromEntries(counts.filter(c=>c.package_id===row.id).map(c=>[c.status,c.total]))));
}
export async function saveVocabularyProgress(db,user,vocabularyId,status,flag,time){
 assert(memoryStates.includes(status),400,'Status hafalan tidak valid.');
 const word=await db.get("SELECT v.id FROM vocabulary v JOIN content_versions cv ON cv.id=v.version_id WHERE v.id=? AND cv.status='published' AND cv.demo=? AND (v.track='hsk' OR v.department IN ('GENERAL',?))",[vocabularyId,flag,user.department]);
 assert(word,404,'Kosakata tidak ditemukan.');
 await db.tx(async t=>{
  await t.run('INSERT INTO vocabulary_progress(user_id,vocabulary_id,status,updated_at) VALUES(?,?,?,?) ON CONFLICT(user_id,vocabulary_id) DO UPDATE SET status=excluded.status,updated_at=excluded.updated_at',[user.id,vocabularyId,status,time]);
  const previous=await t.get('SELECT * FROM lc_review_state WHERE user_id=? AND vocabulary_id=?',[user.id,vocabularyId]),s=scheduleReview(previous,status,null,time);
  await t.run('INSERT INTO lc_review_state(user_id,vocabulary_id,due_at,interval_seconds,repetitions,recall_successes,last_correct,reviewed_at) VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(user_id,vocabulary_id) DO UPDATE SET due_at=excluded.due_at,interval_seconds=excluded.interval_seconds,repetitions=excluded.repetitions,reviewed_at=excluded.reviewed_at',[user.id,vocabularyId,s.due_at,s.interval_seconds,s.repetitions,s.recall_successes,s.last_correct,time]);
  await t.run('INSERT INTO lc_reviews(id,user_id,vocabulary_id,status,correct,created_at) VALUES(?,?,?,?,NULL,?)',[id(),user.id,vocabularyId,status,time]);
 });
 return {vocabulary_id:vocabularyId,status,updated_at:time};
}
