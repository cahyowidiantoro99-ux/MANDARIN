import {readFileSync} from 'node:fs';
import {assert,id} from './domain.mjs';
import {updateUser} from './hanzi-atlas.mjs';
import {learningDay} from './learning-motivation.mjs';
let cache;
const normalize=value=>String(value||'').normalize('NFD').replace(/\p{M}/gu,'').toLowerCase();
export function chengyuData(){
 if(!cache){const source=JSON.parse(readFileSync(new URL('../data/chengyu-atlas.json',import.meta.url),'utf8'));cache={...source,byId:new Map(source.records.map(r=>[r.uid,r])),search:source.records.map(r=>normalize([r.h,r.p,r.id,r.zh,r.ex,r.exId,...r.themes,...r.subthemes].join(' ')))};}
 return cache;
}
export async function chengyuList(db,user,params){
 const data=chengyuData(),stored=await db.get('SELECT state FROM atlas_progress WHERE user_id=?',[user.id]);
 const marks=JSON.parse(stored?.state||'{}').chengyu||{};
 const tokens=normalize((params.get('q')||'').slice(0,150)).split(/\s+/).filter(Boolean),theme=params.get('theme'),pattern=params.get('pattern'),source=params.get('source'),status=params.get('status');
 const found=data.records.filter((r,i)=>tokens.every(t=>data.search[i].includes(t))&&(!theme||r.themes.includes(theme)||r.subthemes.includes(theme))&&(!pattern||r.pattern===pattern)&&(!source||(source==='attachment'?r.attachment:!r.attachment))&&(!status||(marks[r.uid]?.status||'new')===status));
 const page=Math.max(0,Math.min(Number(params.get('page'))||0,Math.max(0,Math.ceil(found.length/12)-1)));
 return {total:found.length,count:data.records.length,page,themes:[...new Set(data.records.flatMap(r=>[...r.themes,...r.subthemes]))],rows:found.slice(page*12,page*12+12).map(r=>({...r,status:marks[r.uid]?.status||'new'}))};
}
export async function chengyuDetail(db,user,uid){
 const data=chengyuData(),record=data.byId.get(uid);assert(record,404,'Idiom tidak ditemukan.');const stored=await db.get('SELECT state FROM atlas_progress WHERE user_id=?',[user.id]);const marks=JSON.parse(stored?.state||'{}').chengyu||{};
 return {...record,status:marks[uid]?.status||'new',relations:data.relations.filter(p=>p.a===record.h||p.b===record.h).map(p=>({...p,other:data.records.find(r=>r.h===(p.a===record.h?p.b:p.a))})),attribution:data.attribution};
}
export async function markChengyu(db,user,uid,status,now,learning){
 assert(chengyuData().byId.has(uid),404,'Idiom tidak ditemukan.');assert(['known','review','unknown'].includes(status),400,'Status tidak valid.');
 return updateUser(db,user,async(t,state)=>{state.chengyu??={};state.chengyu[uid]={status,updated_at:now};const day=learningDay(now),target=uid+':'+day;
 const old=await t.get("SELECT id FROM lc_activity_results WHERE user_id=? AND kind='chengyu_review' AND target_id=?",[user.id,target]);
 if(!old){await t.run('INSERT INTO lc_activity_results(id,user_id,kind,target_id,score,completed,created_at) VALUES(?,?,?,?,0,1,?)',[id(),user.id,'chengyu_review',target,now]);await learning.reward(t,user,'chengyu_review',uid,2,now);}
 return {saved:true,status};});
}
