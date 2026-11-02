import {assert,periodBounds} from './domain.mjs';
import {learningDay,streakFor} from './learning-motivation.mjs';

export const achievementCategories=[
 {key:'hsk',title:'Pendaki HSK',zh:'汉语攀登者',icon:'🏔️',unit:'level',rule:'Level placement atau ujian naik level yang ditetapkan sistem. Penilaian diri tidak dihitung. Posisi level saat ini, terlepas dari pilihan periode.'},
 {key:'time',title:'Bintang Ketekunan',zh:'勤学之星',icon:'⏱️',unit:'seconds',rule:'Jumlah detik belajar aktif pada periode terpilih, berdasarkan sesi yang divalidasi server. Tab menganggur tidak dihitung; sesi mengikuti tanggal mulai.'},
 {key:'xp',title:'Penggerak Semangat',zh:'活力之星',icon:'⚡',unit:'xp',rule:'XP dari aktivitas belajar yang memenuhi syarat pada periode terpilih. Batas hadiah harian dan pencegahan hadiah ganda tetap berlaku.'},
 {key:'mastery',title:'Penakluk Kosakata',zh:'词汇达人',icon:'🧠',unit:'words',rule:'Jumlah Hanzi unik yang saat ini berstatus Hafal, minimal dua recall benar, recall terakhir benar, dan mempunyai recall benar pada periode terpilih. Kosakata berulang di beberapa paket dihitung satu kali.'},
 {key:'weekly',title:'Bintang Evaluasi',zh:'测评之星',icon:'🎯',unit:'score',rule:'Hanya hasil valid pertama ujian mingguan resmi pada level ujian yang dipilih. Gabungan menghitung rata-rata HSK dan Work dengan bobot sama, serta memerlukan kedua jalur. Latihan, placement dan simulasi naik level tidak dihitung.'},
 {key:'streak',title:'Langkah Tanpa Putus',zh:'坚持之星',icon:'🔥',unit:'days',rule:'Rentetan hari belajar terjadwal yang aktif dalam periode terpilih. Hari istirahat pribadi dilewati dan hari ini masih diberi kesempatan. Maksimal 730 hari. Jadwal pribadi bukan absensi HR atau bukti prestasi kerja.'}
];

export function rankAchievement(rows,{allowZero=false}={}){
 const sorted=rows.map(r=>({...r,rank:null})).sort((a,b)=>Number(b.value!=null)-Number(a.value!=null)||(b.value??0)-(a.value??0)||a.id.localeCompare(b.id));
 let position=0,previous=null,rank=null;for(const r of sorted){if(r.value==null||!Number.isFinite(r.value)||(!allowZero&&r.value<=0))continue;position++;if(previous!==r.value)rank=position;r.rank=rank;previous=r.value;}return sorted;
}
const group=rows=>{const map=new Map();for(const r of rows){if(!map.has(r.user_id))map.set(r.user_id,[]);map.get(r.user_id).push(r);}return map;};
const json=(s,fallback)=>{try{return JSON.parse(s);}catch{return fallback;}};
const mean=rows=>rows.length?rows.reduce((n,r)=>n+Number(r.score),0)/rows.length:null;

export async function achievements(service,user,filters={}){
 assert(['employee','leader'].includes(user.role),403,'Akses portal diperlukan.');
 const period=filters.period||'weekly';assert(['weekly','monthly','all'].includes(period),400,'Periode penghargaan tidak valid.');
 const examLevel=Number(filters.exam_level||user.placement_level||1),examTrack=filters.exam_track||'combined';
 assert(Number.isInteger(examLevel)&&examLevel>=1&&examLevel<=6,400,'Level ujian harus 1–6.');assert(['combined','hsk','work'].includes(examTrack),400,'Jalur evaluasi tidak valid.');
 const now=service.clock(),bounds=period==='all'?{start:0,end:now+1,kind:'all'}:periodBounds(period,now),start=bounds.start,end=Math.min(bounds.end,now+1),db=service.db,demo=service.demo?1:0,flag=service.sourceContent?0:demo;
 // Constant query count for the whole cohort. No per-employee queries or writes.
 const [profiles,sessions,xp,mastery,results,preferences,attempts]=await Promise.all([
  db.all("SELECT id,name,department,placement_level FROM profiles WHERE role='employee' AND demo=?",[demo]),
  db.all('SELECT l.user_id,l.started_at,l.active_seconds FROM learning_sessions l JOIN profiles p ON p.id=l.user_id '+(service.sourceContent?'JOIN learning_session_metadata m ON m.session_id=l.id ':'')+'WHERE p.demo=? AND l.started_at>=? AND l.started_at<?'+(service.sourceContent?" AND m.content_mode='source'":''),[demo,start,end]),
  db.all('SELECT x.user_id,x.day,SUM(x.amount) AS amount FROM lc_xp x JOIN profiles p ON p.id=x.user_id WHERE p.demo=? AND x.created_at>=? AND x.created_at<? GROUP BY x.user_id,x.day',[demo,start,end]),
  db.all("SELECT vp.user_id,v.hanzi FROM vocabulary_progress vp JOIN profiles p ON p.id=vp.user_id JOIN vocabulary v ON v.id=vp.vocabulary_id JOIN content_versions cv ON cv.id=v.version_id JOIN lc_review_state rs ON rs.user_id=vp.user_id AND rs.vocabulary_id=vp.vocabulary_id WHERE p.demo=? AND cv.demo=? AND cv.status='published' AND (v.track='hsk' OR v.department IN ('GENERAL',p.department)) AND vp.status='known' AND rs.recall_successes>=2 AND rs.last_correct=1 AND EXISTS(SELECT 1 FROM lc_reviews r WHERE r.user_id=vp.user_id AND r.vocabulary_id=vp.vocabulary_id AND r.correct=1 AND r.created_at>=? AND r.created_at<?)",[demo,flag,start,end]),
  db.all('SELECT r.user_id,s.track,r.score FROM exam_results r JOIN exam_sessions s ON s.id=r.session_id JOIN profiles p ON p.id=r.user_id '+(service.sourceContent?'JOIN exam_session_metadata m ON m.session_id=s.id ':'')+"WHERE p.demo=? AND s.mode='weekly' AND s.status='submitted' AND r.official_key IS NOT NULL AND s.level=? AND s.started_at>=? AND s.started_at<?"+(service.sourceContent?" AND m.content_mode='source' AND m.curriculum='HSK3.0'":''),[demo,examLevel,start,end]),
  db.all('SELECT x.user_id,x.work_days,x.rest_dates FROM lc_preferences x JOIN profiles p ON p.id=x.user_id WHERE p.demo=?',[demo]),
  db.all('SELECT a.user_id,a.created_at FROM (SELECT user_id,created_at FROM lc_practice WHERE created_at>=? AND created_at<? UNION ALL SELECT user_id,created_at FROM lc_activity_results WHERE created_at>=? AND created_at<?) a JOIN profiles p ON p.id=a.user_id WHERE p.demo=?',[start,end,start,end,demo])
 ]);
 const departments=[...new Set(profiles.map(p=>p.department))].sort(),participants=profiles.filter(p=>!filters.department||p.department===filters.department).map(p=>({id:p.id,name:p.name,department:p.department,level:p.placement_level==null?null:Number(p.placement_level)}));
 const ss=group(sessions),xx=group(xp),mm=group(mastery),rr=group(results),aa=group(attempts),pp=new Map(preferences.map(p=>[p.user_id,p]));
 const metrics=new Map(participants.map(p=>{const s=ss.get(p.id)||[],x=xx.get(p.id)||[],r=rr.get(p.id)||[],pref=pp.get(p.id),days=new Set([...s.filter(s=>Number(s.active_seconds)>=60).map(s=>learningDay(Number(s.started_at))),...x.map(x=>x.day),...(aa.get(p.id)||[]).map(a=>learningDay(Number(a.created_at)))]),h=mean(r.filter(r=>r.track==='hsk')),w=mean(r.filter(r=>r.track==='work'));let score=examTrack==='hsk'?h:examTrack==='work'?w:h==null||w==null?null:(h+w)/2;if(score!=null)score=Math.round(score*100)/100;
  return [p.id,{hsk:Number.isInteger(p.level)&&p.level>=1&&p.level<=6?p.level:null,time:s.reduce((n,s)=>n+Math.max(0,Number(s.active_seconds)||0),0),xp:x.reduce((n,x)=>n+Number(x.amount),0),mastery:new Set((mm.get(p.id)||[]).map(w=>String(w.hanzi).normalize('NFKC').replace(/\s/g,''))).size,weekly:score,streak:streakFor([...days],{work_days:json(pref?.work_days,[0,1,2,3,4,5,6]),rest_dates:json(pref?.rest_dates,[])},learningDay(now))}];
 }));
 return {period:{...bounds,end},as_of:now,departments,department:filters.department||'',exam_level:examLevel,exam_track:examTrack,participants,self_id:user.role==='employee'?user.id:null,categories:achievementCategories.map(c=>{const rows=rankAchievement(participants.map(p=>({id:p.id,value:metrics.get(p.id)[c.key]})),{allowZero:c.key==='weekly'});return {...c,rows,eligible_count:rows.filter(r=>r.rank!=null).length};})};
}
