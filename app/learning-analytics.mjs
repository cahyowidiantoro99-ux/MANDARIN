import {assert,periodBounds} from './domain.mjs';
import {learningDay} from './learning-motivation.mjs';

const pct=(a,b)=>b?Math.round(a/b*1000)/10:0;
const average=xs=>xs.length?Math.round(xs.reduce((a,b)=>a+Number(b),0)/xs.length*10)/10:null;
const parse=(s,fallback)=>{try{return JSON.parse(s);}catch{return fallback;}};
export function scheduledDays(profile,preference,start,end){
 const work=new Set(parse(preference?.work_days,'')||[0,1,2,3,4,5,6]),rest=new Set(parse(preference?.rest_dates,'')||[]),out=[];
 for(let n=start;n<end;n+=86400){const day=learningDay(n);if(day<learningDay(Number(profile.created_at)||start))continue;if(work.has(new Date(day+'T12:00:00Z').getUTCDay())&&!rest.has(day))out.push(day);}
 return out;
}

// Every query is batched across the cohort; no per-employee database calls.
export async function learningAnalytics(service,user,filters={}){
 assert(user.role==='leader',403,'Akses khusus Leader.');
 const now=service.clock(),at=filters.at==null||filters.at===''?now:Number(filters.at);
 assert(Number.isFinite(at)&&at>0&&at<=now+86400,400,'Tanggal periode tidak valid.');
 const period=periodBounds(filters.period||'weekly',at),end=Math.min(period.end,now+1),db=service.db,flag=service.sourceContent?0:service.demo?1:0;
 const users=(await db.all("SELECT id,name,department,division,job_title,placement_level,created_at FROM profiles WHERE role='employee' AND demo=?",[service.demo?1:0])).filter(p=>(!filters.q||p.name.toLowerCase().includes(String(filters.q).toLowerCase()))&&['department','division','job_title'].every(k=>!filters[k]||p[k]===filters[k])&&(!filters.level||Number(p.placement_level)===Number(filters.level)));
 const [vocabulary,progress,sessions,xp,practice,games,official,preferences]=await Promise.all([
  db.all("SELECT v.id,v.track,v.level,v.department FROM vocabulary v JOIN content_versions cv ON cv.id=v.version_id WHERE cv.status='published' AND cv.demo=?",[flag]),
  db.all("SELECT p.user_id,p.vocabulary_id,p.status,r.recall_successes,r.last_correct,r.due_at FROM vocabulary_progress p JOIN profiles u ON u.id=p.user_id LEFT JOIN lc_review_state r ON r.user_id=p.user_id AND r.vocabulary_id=p.vocabulary_id WHERE u.demo=?",[service.demo?1:0]),
  db.all('SELECT l.user_id,l.started_at,l.active_seconds FROM learning_sessions l JOIN profiles u ON u.id=l.user_id '+(service.sourceContent?'JOIN learning_session_metadata m ON m.session_id=l.id ':'')+'WHERE u.demo=? AND l.started_at>=? AND l.started_at<?'+(service.sourceContent?" AND m.content_mode='source'":''),[service.demo?1:0,period.start,end]),
  db.all('SELECT x.user_id,x.day,x.activity,x.target_id,x.amount FROM lc_xp x JOIN profiles u ON u.id=x.user_id WHERE u.demo=? AND x.created_at>=? AND x.created_at<?',[service.demo?1:0,period.start,end]),
  db.all('SELECT x.user_id,x.target_id,x.score,x.passed,x.created_at FROM lc_practice x JOIN profiles u ON u.id=x.user_id WHERE u.demo=? AND x.created_at>=? AND x.created_at<?',[service.demo?1:0,period.start,end]),
  db.all('SELECT x.user_id,x.kind,x.target_id,x.score,x.completed,x.created_at FROM lc_activity_results x JOIN profiles u ON u.id=x.user_id WHERE u.demo=? AND x.created_at>=? AND x.created_at<?',[service.demo?1:0,period.start,end]),
  db.all('SELECT r.user_id,s.track,r.score,r.created_at FROM exam_results r JOIN exam_sessions s ON s.id=r.session_id JOIN profiles u ON u.id=r.user_id WHERE u.demo=? AND r.official_key IS NOT NULL AND s.started_at>=? AND s.started_at<?',[service.demo?1:0,period.start,end]),
  db.all('SELECT x.user_id,x.work_days,x.rest_dates FROM lc_preferences x JOIN profiles u ON u.id=x.user_id WHERE u.demo=?',[service.demo?1:0])
 ]);
 const group=rows=>{const m=new Map();for(const r of rows){if(!m.has(r.user_id))m.set(r.user_id,[]);m.get(r.user_id).push(r);}return m;};
 const pg=group(progress),sg=group(sessions),xg=group(xp),prg=group(practice),gg=group(games),og=group(official),pref=new Map(preferences.map(p=>[p.user_id,p]));
 const hsk=new Map(),work=new Map();for(const v of vocabulary){const m=v.track==='hsk'?hsk:work,key=v.track==='hsk'?Number(v.level):v.department;if(!m.has(key))m.set(key,new Set());m.get(key).add(v.id);}
 const employees=users.map(u=>{
  const h=hsk.get(Number(u.placement_level)||1)||new Set(),w=new Set([...(work.get('GENERAL')||[]),...(work.get(u.department)||[])]),all=new Set([...h,...w]),rows=(pg.get(u.id)||[]).filter(p=>all.has(p.vocabulary_id));
  const measure=ids=>{const r=rows.filter(p=>ids.has(p.vocabulary_id));const proven=r.filter(p=>p.status==='known'&&Number(p.recall_successes)>=2&&Number(p.last_correct)===1).length;return {total:ids.size,studied:r.length,proven,coverage:pct(r.length,ids.size),mastery:pct(proven,ids.size)};};
  const ss=sg.get(u.id)||[],xx=xg.get(u.id)||[],pp=prg.get(u.id)||[],games=gg.get(u.id)||[],oo=og.get(u.id)||[],days=new Set([...ss.filter(s=>Number(s.active_seconds)>=60).map(s=>learningDay(Number(s.started_at))),...xx.map(x=>x.day),...pp.map(p=>learningDay(Number(p.created_at))),...games.map(p=>learningDay(Number(p.created_at)))]);
  // Only closed scheduled days enter the denominator; today's missions are still in progress.
  const scheduled=scheduledDays(u,pref.get(u.id),period.start,Math.min(end,Date.parse(learningDay(now)+'T00:00:00Z')/1000-28800));
  const daily=new Map();for(const x of xx){if(!daily.has(x.day))daily.set(x.day,{review:new Set(),grammar:new Set(),recall:new Set()});daily.get(x.day)[x.activity]?.add(x.target_id);}
  const done=scheduled.reduce((n,d)=>{const x=daily.get(d);return n+Number((x?.review.size||0)>=10)+Number((x?.grammar.size||0)>=1)+Number((x?.recall.size||0)>=3);},0),seconds=ss.reduce((n,s)=>n+Number(s.active_seconds),0);
  return {...u,hsk:measure(h),work:measure(w),distribution:{known:rows.filter(p=>p.status==='known').length,review:rows.filter(p=>p.status==='review').length,unknown:rows.filter(p=>p.status==='unknown').length,untouched:all.size-rows.length},due:rows.filter(p=>!p.due_at||Number(p.due_at)<=now).length,seconds,sessions:ss.filter(s=>Number(s.active_seconds)>0).length,active:days.size>0,active_days:days.size,scheduled_days:scheduled.length,consistency:pct(scheduled.filter(d=>days.has(d)).length,scheduled.length),missions_done:done,missions_total:scheduled.length*3,mission_rate:pct(done,scheduled.length*3),xp:xx.reduce((n,x)=>n+Number(x.amount),0),completed_materials:new Set([...pp.filter(p=>Number(p.passed)===1).map(p=>'grammar:'+p.target_id),...games.filter(p=>Number(p.completed)===1).map(p=>p.kind+':'+p.target_id)]).size,practice_average:average([...pp,...games].map(p=>p.score)),official_hsk:average(oo.filter(p=>p.track==='hsk').map(p=>p.score)),official_work:average(oo.filter(p=>p.track==='work').map(p=>p.score))};
 });
 const selected=new Set(users.map(u=>u.id)),trends=new Map();for(const [kind,rows] of [['practice',[...practice,...games]],['official_hsk',official.filter(x=>x.track==='hsk')],['official_work',official.filter(x=>x.track==='work')]])for(const r of rows){if(!selected.has(r.user_id))continue;const day=learningDay(Number(r.created_at));if(!trends.has(day))trends.set(day,{day,practice:[],official_hsk:[],official_work:[]});trends.get(day)[kind].push(Number(r.score));}
 const departments=[...new Set(users.map(u=>u.department))].sort().map(department=>{const es=employees.filter(e=>e.department===department);return {department,total:es.length,active:es.filter(e=>e.active).length,average_minutes:average(es.map(e=>e.seconds/60)),hsk_mastery:average(es.map(e=>e.hsk.mastery)),work_mastery:average(es.map(e=>e.work.mastery))};});
 return {period,snapshot_at:now,employees,departments,trends:[...trends.values()].sort((a,b)=>a.day.localeCompare(b.day)).map(r=>({day:r.day,practice:average(r.practice),official_hsk:average(r.official_hsk),official_work:average(r.official_work)})),kpi:{total:employees.length,active:employees.filter(e=>e.active).length,average_minutes:average(employees.map(e=>e.seconds/60)),mission_rate:pct(employees.reduce((n,e)=>n+e.missions_done,0),employees.reduce((n,e)=>n+e.missions_total,0))}};
}
