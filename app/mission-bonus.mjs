import {periodBounds} from './domain.mjs';
import {missionDay,MISSION_V2_FROM,recordMission} from './learning-missions.mjs';
export async function dailyBonus(db,uid,n,{sourceContent=false}={}){
 const day=missionDay(n),week=periodBounds('weekly',n),start=Date.parse(day+'T00:00:00+08:00')/1000;
 const existing=await db.get('SELECT kind,target_id FROM lc_daily_bonus WHERE user_id=? AND day=?',[uid,day]);if(existing){const rows=await db.all('SELECT kind,target_id FROM lc_mission_events WHERE user_id=? AND day=?',[uid,day]),view=bonusView(existing.kind,existing.target_id,rows);if(view.current>=view.target)await recordMission(db,uid,'bonus',existing.kind,n);return {...view,day,optional:true,policy_from:MISSION_V2_FROM};}
 const [events,stored,errors,profile,weekly]=await Promise.all([
 db.all('SELECT kind,target_id FROM lc_mission_events WHERE user_id=? AND day=?',[uid,day]),
 db.get('SELECT state FROM atlas_progress WHERE user_id=?',[uid]),
 db.all('SELECT area,target_id FROM lc_mission_errors WHERE user_id=? AND active=1',[uid]),
 db.get('SELECT placement_level FROM profiles WHERE id=?',[uid]),
 db.all("SELECT s.track,r.created_at FROM exam_sessions s JOIN exam_results r ON r.session_id=s.id LEFT JOIN exam_session_metadata m ON m.session_id=s.id WHERE s.user_id=? AND s.mode='weekly' AND s.week=? AND s.status='submitted' AND r.official_key IS NOT NULL"+(sourceContent?" AND m.content_mode='source' AND m.curriculum='HSK3.0'":''),[uid,week.key])]);
 let atlas={};try{atlas=JSON.parse(stored?.state||'{}');}catch{}
 const pending=new Set(errors.filter(e=>['atlas_pinyin','atlas_vocab_pairs'].includes(e.area)).map(e=>e.area+':'+e.target_id));for(const [key,e] of Object.entries(atlas.mistakes||{}))if(e.active)pending.add('atlas_pinyin:'+key);for(const [key,e] of Object.entries(atlas.vocabulary?.mistakes||{}))if(e.active)pending.add('atlas_vocab_pairs:'+key);
 let chosen=await db.get('SELECT kind,target_id FROM lc_daily_bonus WHERE user_id=? AND day=?',[uid,day]);
 if(!chosen){const choices=[{kind:'accuracy',target_id:''},{kind:'explore',target_id:''}];if(pending.size>=3)choices.push({kind:'repair',target_id:''});const track=['hsk','work'].find(track=>!weekly.some(r=>r.track===track));if(profile?.placement_level&&track)choices.push({kind:'weekly',target_id:track});const seed=Math.floor(Date.parse(day)/86400000)+[...uid].reduce((s,c)=>s+c.charCodeAt(0),0);const pick=choices[seed%choices.length];await db.run('INSERT INTO lc_daily_bonus(user_id,day,kind,target_id) VALUES(?,?,?,?) ON CONFLICT(user_id,day) DO NOTHING',[uid,day,pick.kind,pick.target_id]);chosen=await db.get('SELECT kind,target_id FROM lc_daily_bonus WHERE user_id=? AND day=?',[uid,day]);}
 for(const r of weekly)if(Number(r.created_at)>=start)events.push({kind:'weekly',target_id:r.track});
 const view=bonusView(chosen.kind,chosen.target_id,events);
 if(view.current>=view.target)await recordMission(db,uid,'bonus',chosen.kind,n);
 return {...view,kind:chosen.kind,day,optional:true,policy_from:MISSION_V2_FROM};
}

export function bonusView(kind,target,events=[]){
 const count=kind=>new Set(events.filter(e=>e.kind===kind).map(e=>e.target_id)).size;
 const options={accuracy:{title:'Tantangan akurasi',description:'Selesaikan satu latihan dengan nilai minimal 80.',target:1,current:Math.min(1,count('accuracy')),href:'#learning'},explore:{title:'Jelajahi dua jenis latihan',description:'Selesaikan latihan dari dua jenis berbeda. Tidak wajib lulus.',target:2,current:Math.min(2,count('practice_kind')),href:'#learning'},repair:{title:'Perbaiki kesalahanmu',description:'Jawab ulang 3 materi berbeda yang sebelumnya salah dengan benar.',target:3,current:Math.min(3,count('repair')),href:'#learning-mistakes'},weekly:{title:'Evaluasi mingguan',description:'Selesaikan ujian '+(target==='hsk'?'HSK':'kosakata kerja')+' mingguan yang belum dituntaskan. Tidak wajib lulus.',target:1,current:Number(events.some(e=>e.kind==='weekly'&&e.target_id===target)),href:'#examination'}};
 return {...options[kind],kind,optional:true};
}
