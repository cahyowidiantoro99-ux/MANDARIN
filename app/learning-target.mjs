import {assert} from './domain.mjs';

// TSZ15025-S01A, pp. 10–14. Activities are preparation, not official assessment results.
const plans = {
  1:{reference:'HSK 2 · Standar kelulusan 80',tasks:[['listen','Latih soal listening HSK 2, termasuk benar/salah dan mencocokkan gambar.','#examination'],['read','Latih membaca HSK 2, melengkapi kalimat dan mencocokkan gambar.','#learning']]},
  2:{reference:'HSK 3 · Standar kelulusan 80',tasks:[['listen','Latih listening HSK 3 dan pilihan berdasarkan dialog.','#examination'],['read','Latih membaca, pilihan kata, dan susunan kalimat HSK 3.','#learning'],['write','Latih melengkapi kalimat dan menulis Hanzi HSK 3.','#hanzi']]},
  3:{reference:'HSK 4 · Standar kelulusan 80',tasks:[['listen','Latih memahami dialog dan gambar pada listening HSK 4.','#examination'],['read','Latih mencocokkan makna dan mengisi bagian kosong pada bacaan HSK 4.','#learning'],['write','Buat kalimat dari kosakata dan gambar HSK 4.','#examination']]},
  4:{reference:'Teori HSK 5 ≥60 · Wawancara ≥70',tasks:[['listen','Latih menyimak dialog HSK 5.','#examination'],['read','Latih pemahaman teks HSK 5.','#learning'],['write','Latih menulis paragraf berdasarkan gambar.','#examination'],['interview','Latih wawancara, percakapan kerja, dan terjemahan situasional (masing-masing 50% dalam wawancara).','#practice']]},
  5:{reference:'Cakupan HSK 1–6 · Terjemahan kalimat ≥80 · Nilai gabungan ≥70',tasks:[['words','Ulangi kosakata baru HSK 1–6, termasuk istilah kerja.','#learning'],['translate','Latih 10 soal menerjemahkan kalimat dengan kosakata HSK 6.','#examination'],['interpret','Latih menjadi penerjemah dalam satu dialog situasi kerja.','#practice']]},
  6:{reference:'Kelas 6 SD atau HSK 6 · Terjemahan ≥60, dikte ≥70, membaca ≥60',tasks:[['translate','Latih 10 terjemahan Mandarin–Indonesia dan 10 Indonesia–Mandarin.','#examination'],['dictation','Latih mengetik atau menulis dari dikte pendek, kurang dari 200 Hanzi.','#hanzi'],['read','Latih membaca teks Mandarin setara kelas 6 SD dengan pendamping.','#practice']]},
  7:{reference:'Kelas 1 SMP · Terjemahan ≥80, dikte ≥70, membaca ≥80',tasks:[['translate','Latih 10 terjemahan Mandarin–Indonesia dan 10 Indonesia–Mandarin setara kelas 1 SMP.','#examination'],['dictation','Latih dikte pendek kurang dari 200 Hanzi setara kelas 1 SMP.','#hanzi'],['read','Latih membaca teks Mandarin setara kelas 1 SMP dengan pendamping.','#practice']]},
  8:{reference:'Kelas 2–3 SMP · Komputer ≥70 atau tertulis ≥60',tasks:[['idiom','Latih menjelaskan asal-usul, makna harfiah, dan makna kiasan idiom.'],['synonyms','Latih 10 soal sinonim dan antonim.','#practice'],['proofread','Latih mengidentifikasi ejaan dan kalimat yang salah.','#hanzi-compare'],['read','Latih membaca teks dan menjawab 3 pertanyaan secara tertulis.'],['write','Latih menulis karangan sesuai tema dengan minimal 400 karakter Mandarin.']]},
};
const asPlan=(level,row=null)=>({level,reference:plans[level].reference,tasks:plans[level].tasks.map(([id,label,href])=>({id,label,href})),date:row?.target_date||null});
export const goalOptions=Object.keys(plans).map(level=>asPlan(Number(level)));
function targetEpoch(day){
  if(typeof day!=='string'||!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(day))return NaN;
  const start=Date.parse(day+'T00:00:00Z');
  if(!Number.isFinite(start)||new Date(start).toISOString().slice(0,10)!==day)return NaN;
  return (start+86400000)/1000-28800;
}
export async function learningTarget(service,u){
  service.employee(u);
  const row=await service.db.get('SELECT level,target_date FROM employee_learning_targets WHERE user_id=?',[u.id]);
  const now=service.clock();
  return {target:row?{...asPlan(Number(row.level),row),deadline:targetEpoch(row.target_date)}:null,server_now:now};
}
export async function setLearningTarget(service,u,input){
  service.employee(u);
  const now=service.clock(),{level,date}=input;
  assert(Number.isInteger(level)&&Object.hasOwn(plans,level),400,'Pilih Level Perusahaan 1–8.');
  const deadline=targetEpoch(date);
  assert(Number.isFinite(deadline)&&deadline>now&&deadline<now+86400*366*5,400,'Tanggal harus masih berlaku dan paling jauh lima tahun.');
  await service.db.run('INSERT INTO employee_learning_targets(user_id,level,target_date) VALUES(?,?,?) ON CONFLICT(user_id) DO UPDATE SET level=excluded.level,target_date=excluded.target_date',[u.id,level,date]);
  return learningTarget(service,u);
}

export async function dashboardHistory(service,u,kind,offset){
  service.employee(u);
  const queries={
    exams:'SELECT s.id,s.track,s.mode,s.level,s.status,s.started_at,s.official,r.score,r.passed FROM exam_sessions s LEFT JOIN exam_results r ON r.session_id=s.id WHERE s.user_id=? ORDER BY s.started_at DESC,s.id DESC',
    xp:'SELECT activity,SUM(amount) AS amount,MAX(created_at) AS created_at FROM lc_xp WHERE user_id=? GROUP BY activity,day,CASE WHEN activity=\'atlas_pinyin\' THEN substr(target_id,1,36) ELSE target_id END ORDER BY MAX(created_at) DESC,activity,day',
    learning:'SELECT p.title,l.started_at,l.active_seconds FROM learning_sessions l JOIN learning_packages p ON p.id=l.package_id WHERE l.user_id=? ORDER BY l.started_at DESC,l.id DESC',
    activities:"SELECT kind,score,created_at FROM (SELECT id,kind,score,created_at FROM lc_activity_results WHERE user_id=? UNION ALL SELECT id,'grammar' AS kind,score,created_at FROM lc_practice WHERE user_id=?) events ORDER BY created_at DESC,id DESC",
  };
  assert(Object.hasOwn(queries,kind)&&Number.isSafeInteger(offset)&&offset>=0,400,'Riwayat tidak valid.');
  const args=kind==='activities'?[u.id,u.id]:[u.id];
  const rows=await service.db.all(queries[kind]+' LIMIT ? OFFSET ?',[...args,21,offset]);
  return {rows:rows.slice(0,20),more:rows.length>20};
}
