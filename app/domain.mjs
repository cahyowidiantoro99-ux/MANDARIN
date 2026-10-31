import { randomInt, randomUUID, scryptSync, timingSafeEqual, randomBytes, createHash } from 'node:crypto';
export const id=()=>randomUUID();
export const now=()=>Math.floor(Date.now()/1000);
export const hash=s=>createHash('sha256').update(s).digest('hex');
export const token=()=>randomBytes(32).toString('hex');
export class AppError extends Error {constructor(status,message){super(message);this.status=status;}}
export const assert=(condition,status,message)=>{if(!condition)throw new AppError(status,message);};
export function passwordHash(p){const salt=randomBytes(16).toString('hex');return salt+':'+scryptSync(p,salt,64).toString('hex');}
export function passwordValid(p,encoded){try{const [s,h]=encoded.split(':');return timingSafeEqual(scryptSync(p,s,64),Buffer.from(h,'hex'));}catch{return false;}}
export function strongPassword(p){return typeof p==='string'&&p.length>=12&&p.length<=128&&/[a-z]/.test(p)&&/[A-Z]/.test(p)&&/[0-9]/.test(p)&&/[^a-zA-Z0-9]/.test(p);}
export function shuffle(arr){const a=[...arr];for(let i=a.length-1;i>0;i--){const j=randomInt(i+1);[a[i],a[j]]=[a[j],a[i]];}return a;}
const OFFSET=8*3600, DAY=86400;
export function periodBounds(kind='weekly',t=now()){
  assert(['weekly','monthly','quarterly','semester','yearly'].includes(kind),400,'Periode tidak valid.');
  const d=new Date((t+OFFSET)*1000);let y=d.getUTCFullYear(),m=d.getUTCMonth(),day=d.getUTCDate(),start,end;
  if(kind==='weekly'){start=Date.UTC(y,m,day-((d.getUTCDay()+6)%7))/1000-OFFSET;end=start+7*DAY;}
  else{const span={monthly:1,quarterly:3,semester:6,yearly:12}[kind];m=Math.floor(m/span)*span;start=Date.UTC(y,m,1)/1000-OFFSET;end=Date.UTC(y,m+span,1)/1000-OFFSET;}
  return {start,end,key:new Date((start+OFFSET)*1000).toISOString().slice(0,10),kind};
}
export function overall({hsk,work,improvementHsk,improvementWork,completion,consistency,invalid=false,sufficient=false}){
  const data=[hsk,work,improvementHsk,improvementWork,completion,consistency];
  if(data.some(v=>v==null||!Number.isFinite(v)))return {score:null,status:'insufficient_data',eligible:false};
  const score=.25*hsk+.25*work+.15*improvementHsk+.15*improvementWork+.1*completion+.1*consistency;
  const eligible=completion>=80&&consistency>=80&&!invalid&&sufficient;
  return {score:Math.round(score*100)/100,status:eligible?'eligible':'Not eligible',eligible};
}
export function improvement(baseline,current,benchmark,baselineBenchmark){
  if(baseline==null||current==null||!benchmark||benchmark!==baselineBenchmark)return null;
  // Policy v1: normalized gain; same calibrated benchmark only. A baseline of 100 has no headroom.
  return baseline===100?(current===100?100:0):Math.max(0,Math.min(100,100*(current-baseline)/(100-baseline)));
}
export function publicProfile(p,own=false){const out={id:p.id,name:p.name,department:p.department,division:p.division,job_title:p.job_title,self_level:p.self_level,placement_level:p.placement_level,baseline_hsk:p.baseline_hsk,baseline_work:p.baseline_work,role:p.role,demo:!!p.demo,created_at:p.created_at};if(own){out.employee_id=p.employee_id;out.email=p.email;}return out;}
export function grade(snapshots,answers){let correct=0,total=0;for(const q of snapshots){total+=q.weight; if(answers[q.id]===q.correct_id)correct+=q.weight;}return total?Math.round(correct/total*10000)/100:0;}
