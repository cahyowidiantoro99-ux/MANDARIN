import {openDatabase} from '../app/db.mjs';
import {id,now,passwordHash,periodBounds} from '../app/domain.mjs';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
export async function seed(db,{demo=false,clock=now}={}){
 if(process.env.NODE_ENV==='production'&&demo)throw Error('DEMO forbidden in production');
 return db.tx(async t=>{
  for(const d of ['DBB1','DBB2','TRB','TB','EMERC','EM-ERT','KMU'])await t.run('INSERT INTO departments(id,name) VALUES(?,?) ON CONFLICT(id) DO NOTHING',[d,d]);
  for(const name of ['Operasional','Teknik','SDM']){await t.run('INSERT INTO divisions(id,name) VALUES(?,?) ON CONFLICT(id) DO NOTHING',[name,name]);}
  for(const name of ['Operator','Teknisi','Staf'])await t.run('INSERT INTO job_titles(id,name) VALUES(?,?) ON CONFLICT(id) DO NOTHING',[name,name]);
  for(let l=1;l<=6;l++){await t.run('INSERT INTO hsk_levels(id) VALUES(?) ON CONFLICT(id) DO NOTHING',[l]);for(let n=1;n<=10;n++)await t.run('INSERT INTO learning_packages(id,title,track,level,ordinal) VALUES(?,?,?,?,?) ON CONFLICT(track,level,ordinal) DO NOTHING',[id(),`HSK ${l} · Paket ${String(n).padStart(2,'0')}`,'hsk',l,n]);}
  // Work uses level 0 solely as package catalogue grouping, never an HSK level.
  for(let n=1;n<=10;n++)await t.run('INSERT INTO learning_packages(id,title,track,level,ordinal) VALUES(?,?,?,?,?) ON CONFLICT(track,level,ordinal) DO NOTHING',[id(),`Kosakata Kerja · Paket ${String(n).padStart(2,'0')}`,'work',0,n]);
  const configs={placement_threshold:80,quiz_count:10,exam_minutes:25,minimum_official:1,ranking_policy:'v1-normalized-gain',allow_export:false};
  for(const [k,v]of Object.entries(configs))await t.run('INSERT INTO app_config(id,value) VALUES(?,?) ON CONFLICT(id) DO NOTHING',[k,JSON.stringify(v)]);
  await t.run('INSERT INTO ranking_policy_versions(id,formula,created_at) VALUES(?,?,?) ON CONFLICT(id) DO NOTHING',['v1-normalized-gain',JSON.stringify({weights:[25,25,15,15,10,10],improvement:'100*(current-baseline)/(100-baseline), clipped 0..100, matching calibrated benchmark only',weeks:'full ended weeks in period after joining',minimum_official:1}),clock()]);
  if(!demo||await t.get("SELECT id FROM profiles WHERE employee_id='DEMO001'"))return;
  const n=clock(),week=periodBounds('weekly',n);const employees=[];
  const specs=[['DEMO001','DEMO · Peserta Baru','DBB1',null,null,null],['DEMO002','DEMO · Ayu','DBB2',1,40,45],['DEMO003','DEMO · Bima','TRB',2,50,50],['DEMO004','DEMO · Citra','TB',1,60,60],['DEMO005','DEMO · Danu','EMERC',null,null,null],['LEADER','DEMO · Leader Bersama','KMU',null,null,null]];
  for(const [eid,name,dept,level,bh,bw]of specs){const uid=id(),leader=eid==='LEADER';await t.run('INSERT INTO profiles(id,employee_id,name,email,department,division,job_title,self_level,placement_level,baseline_hsk,baseline_work,hsk_benchmark,work_benchmark,role,password_hash,demo,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',[uid,eid,name,`${eid.toLowerCase()}@example.invalid`,dept,dept==='TRB'?'Teknik':'Operasional',dept==='TRB'?'Teknisi':'Operator',1,level,bh,bw,level?`DEMO-HSK-${level}`:null,level?'DEMO-WORK':null,leader?'leader':'employee',passwordHash('DemoMandarin!2026'),1,week.start-604800*10]);employees.push({id:uid,eid,level});}
  const cv=id();await t.run('INSERT INTO content_versions(id,source,status,reviewer,demo,created_at) VALUES(?,?,?,?,1,?)',[cv,'DEMO synthetic fixtures; not official ECB content','published','DEMO-test-fixtures',n]);
  const pairs=[['你好','nǐ hǎo','halo'],['谢谢','xièxie','terima kasih'],['学习','xuéxí','belajar'],['工作','gōngzuò','bekerja'],['安全','ānquán','aman'],['设备','shèbèi','peralatan'],['检查','jiǎnchá','memeriksa'],['时间','shíjiān','waktu'],['今天','jīntiān','hari ini'],['明天','míngtiān','besok']];
  const scopes=[...Array.from({length:6},(_,i)=>({track:'hsk',level:i+1,department:null})),...['GENERAL','DBB1','DBB2','TRB','TB','EMERC','EM-ERT','KMU'].map(d=>({track:'work',level:null,department:d}))];
  for(const scope of scopes){for(let i=0;i<210;i++){const pair=pairs[i%pairs.length],qid=id(),kind=i%3===0?'grammar':i%3===1?'translation':'vocabulary',direction=i%2===0?'zh-id':'id-zh';let prompt,correct,others;
    if(kind==='grammar'){prompt=`[DEMO ${i+1}] Lengkapi 我正在___。 (Saya sedang belajar.)`;correct='学习';others=['明天','安全','时间'];}
    else if(direction==='zh-id'){prompt=`[DEMO ${i+1}] Apa arti ${pair[0]} (${pair[1]})?`;correct=pair[2];others=pairs.filter(p=>p[2]!==correct).slice(0,3).map(p=>p[2]);}
    else{prompt=`[DEMO ${i+1}] Pilih Mandarin untuk “${pair[2]}”.`;correct=pair[0];others=pairs.filter(p=>p[0]!==correct).slice(0,3).map(p=>p[0]);}
    const options=[correct,...others].map(label=>({id:id(),label}));await t.run('INSERT INTO questions(id,track,level,department,kind,direction,prompt,options,correct_id,explanation,benchmark,version_id) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)',[qid,scope.track,scope.level,scope.department,kind,direction,prompt,JSON.stringify(options),options[0].id,`DEMO: ${kind==='grammar'?'正在 diikuti kata kerja; 学习 berarti belajar.':`${pair[0]} (${pair[1]}) berarti ${pair[2]}.`} Level/pengulangan sintetis hanya untuk QA mekanisme.`,scope.track==='hsk'?`DEMO-HSK-${scope.level}`:'DEMO-WORK',cv]);
    for(const o of options)await t.run('INSERT INTO question_options(id,question_id,label) VALUES(?,?,?)',[o.id,qid,o.label]);
   }
  }
  const packages=await t.all('SELECT * FROM learning_packages');for(const p of packages){for(let i=0;i<pairs.length;i++){const v=id(),pair=pairs[i];await t.run('INSERT INTO vocabulary(id,hanzi,pinyin,meaning,track,level,department,version_id) VALUES(?,?,?,?,?,?,?,?)',[v,pair[0],pair[1],pair[2],p.track,p.level,p.track==='work'?'GENERAL':null,cv]);await t.run('INSERT INTO package_vocabulary(package_id,vocabulary_id) VALUES(?,?)',[p.id,v]);}}
  // Historical fixtures exercise eligible, incomplete, fail and pass states. No real employee data.
  const pack=packages[0].id;
  for(const e of employees.filter(e=>e.level))for(let w=1;w<=3;w++){const start=week.start-604800*w;for(const track of ['hsk','work']){if(e.eid==='DEMO004'&&track==='work')continue;const sid=id(),score=e.eid==='DEMO003'?70:90;await t.run('INSERT INTO exam_sessions(id,user_id,track,mode,level,week,status,started_at,deadline,submitted_at,official,demo) VALUES(?,?,?,?,?,?,?,?,?,?,1,1)',[sid,e.id,track,'weekly',e.level,periodBounds('weekly',start).key,'submitted',start+3600,start+5100,start+3900]);await t.run('INSERT INTO exam_results(id,session_id,user_id,score,passed,official_key,benchmark,created_at) VALUES(?,?,?,?,?,?,?,?)',[id(),sid,e.id,score,score>=80?1:0,`${e.id}:${track}:${periodBounds('weekly',start).key}`,track==='hsk'?`DEMO-HSK-${e.level}`:'DEMO-WORK',start+3900]);}
   const seconds=e.eid==='DEMO004'?600:3600;for(let s=0;s<seconds/1200;s++)await t.run('INSERT INTO learning_sessions(id,user_id,package_id,started_at,last_heartbeat,active_seconds,closed) VALUES(?,?,?,?,?,?,1)',[id(),e.id,pack,start+7200+s*1500,start+8400+s*1500,Math.min(1200,seconds-s*1200)]);
  }
 });
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){const db=await openDatabase();await db.migrate();const demo=process.argv.includes('--demo')||process.env.DEMO_MODE==='true';await seed(db,{demo});await db.close();console.log(demo?'DEMO seed ready. No production content published.':'Catalogue/config seed ready. No accounts or content published.');}
