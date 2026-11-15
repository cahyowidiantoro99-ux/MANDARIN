export function learningMissions(counts={},practice=0){
 const c=k=>Number(counts[k]||0);
 return [
 {title:'Review 10 kosakata atau idiom berbeda',current:Math.min(10,c('review')+c('chengyu_review')),target:10},
 {title:'Selesaikan 1 latihan bahasa',current:Math.min(1,Number(practice)+['grammar','pair_quick','pair_bank','atlas_pinyin','exam_practice','matching','sentence','listening','story'].reduce((n,k)=>n+c(k),0)),target:1},
 {title:'Jawab 3 recall quiz dengan benar',current:Math.min(3,c('recall')),target:3}
 ];
}

// The former 3-mission rule remains authoritative before this WITA date.
export const MISSION_V2_FROM='2026-11-16';
export const MISSION_V2_EPOCH=Date.parse(MISSION_V2_FROM+'T00:00:00+08:00')/1000;
export const missionDay=n=>new Date((Number(n)+28800)*1000).toISOString().slice(0,10);
export function fiveMissions(events=[],day=MISSION_V2_FROM){
 const rows=events.filter(e=>e.day===day),count=kind=>new Set(rows.filter(e=>e.kind===kind).map(e=>e.target_id)).size;
 const seconds=rows.filter(e=>e.kind==='time').reduce((n,e)=>n+Number(e.amount),0);
 return [
 {key:'review',title:'Rawat kosakata & idiom',description:'Review 10 kosakata atau idiom berbeda.',current:Math.min(10,count('review')),target:10,href:'#study/review'},
 {key:'recall',title:'Buktikan ingatanmu',description:'Jawab recall dengan benar pada 5 kosakata berbeda.',current:Math.min(5,count('recall')),target:5,href:'#recall'},
 {key:'hanzi',title:'Asah Hanzi & Pinyin',description:'Jawab 5 soal Hanzi–Pinyin atau bentuk mirip yang berbeda. Tidak wajib benar.',current:Math.min(5,count('hanzi')),target:5,href:'#pinyin'},
 {key:'practice',title:'Terapkan bahasa Mandarin',description:'Selesaikan 1 latihan matching, kalimat, listening, grammar, terjemahan, pasangan kata, atau cerita. Tidak wajib lulus.',current:Math.min(1,count('practice')),target:1,href:'#learning'},
 {key:'time',title:'Luangkan waktu belajar',description:'Kumpulkan 10 menit aktif di berbagai menu belajar. Waktu diam tidak dihitung.',current:Math.min(600,seconds),target:600,unit:'seconds',href:'#learning'}
 ];
}
export async function recordMission(db,uid,kind,target,n,amount=1){
 if(n<MISSION_V2_EPOCH)return;
 await db.run('INSERT INTO lc_mission_events(user_id,day,kind,target_id,amount,created_at) VALUES(?,?,?,?,?,?) ON CONFLICT(user_id,day,kind,target_id) DO NOTHING',[uid,missionDay(n),kind,String(target),amount,n]);
 if(['accuracy','practice_kind','repair','weekly'].includes(kind)){const chosen=await db.get('SELECT kind,target_id FROM lc_daily_bonus WHERE user_id=? AND day=?',[uid,missionDay(n)]);if(chosen){const spec={accuracy:['accuracy',1],explore:['practice_kind',2],repair:['repair',3],weekly:['weekly',1]}[chosen.kind];if(spec&&spec[0]===kind){const row=await db.get('SELECT COUNT(*) AS n FROM lc_mission_events WHERE user_id=? AND day=? AND kind=?'+(kind==='weekly'?' AND target_id=?':''),[uid,missionDay(n),kind,...(kind==='weekly'?[chosen.target_id]:[])]);if(Number(row.n)>=spec[1])await recordMission(db,uid,'bonus',chosen.kind,n);}}}
}
export async function practiceMission(db,uid,kind,target,score,n){await recordMission(db,uid,'practice',kind+':'+target,n);await recordMission(db,uid,'practice_kind',kind,n);if(Number(score)>=80)await recordMission(db,uid,'accuracy',kind+':'+target,n);}
export async function answerMission(db,uid,area,target,correct,n,{hanzi=false,knownWrong=false}={}){
 if(n<MISSION_V2_EPOCH)return;
 if(hanzi)await recordMission(db,uid,'hanzi',area+':'+target,n);
 const old=await db.get('SELECT active FROM lc_mission_errors WHERE user_id=? AND area=? AND target_id=?',[uid,area,String(target)]);
 if(correct&&(Number(old?.active)===1||knownWrong))await recordMission(db,uid,'repair',area+':'+target,n);
 await db.run('INSERT INTO lc_mission_errors(user_id,area,target_id,active,updated_at) VALUES(?,?,?,?,?) ON CONFLICT(user_id,area,target_id) DO UPDATE SET active=excluded.active,updated_at=excluded.updated_at',[uid,area,String(target),correct?0:1,n]);
}
export function studyTimeSource(source=false){return "(SELECT CAST(l.id AS TEXT) AS id,l.user_id,l.started_at,l.active_seconds FROM learning_sessions l "+(source?'JOIN learning_session_metadata sm ON sm.session_id=l.id ':'')+"WHERE l.started_at<"+MISSION_V2_EPOCH+(source?" AND sm.content_mode='source'":'')+" UNION ALL SELECT target_id AS id,user_id,created_at AS started_at,amount AS active_seconds FROM lc_mission_events WHERE kind='time' AND day>='"+MISSION_V2_FROM+"')";}

export function activeStudyDays(rows){const days=new Set(),totals=new Map();for(const r of rows){const day=missionDay(r.started_at),seconds=Number(r.active_seconds)||0;if(day<MISSION_V2_FROM){if(seconds>=60)days.add(day);}else totals.set(day,(totals.get(day)||0)+seconds);}for(const [day,seconds]of totals)if(seconds>=60)days.add(day);return [...days];}
