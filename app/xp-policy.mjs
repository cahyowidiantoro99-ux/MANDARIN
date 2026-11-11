import {createHash} from 'node:crypto';
import {learningDay} from './learning-motivation.mjs';
export const dailyXpLimits={chengyu_review:20,review:50,recall:20,grammar:5,matching:2,listening:2,sentence:2,story:2,contrast:5,pair_quick:3};
export const xpRules=[
 ['Belajar Idiom / Chengyu','2 XP per idiom berbeda yang diberi status per hari, maksimal 20 idiom (40 XP). Status Hafal, Ragu, dan Belum Hafal bernilai sama.'],
 ['Review flashcard HSK / pekerjaan','2 XP per kosakata berbeda per hari; maksimal 50 kosakata (100 XP/hari). Hafal, Ragu, dan Belum Hafal bernilai sama.'],
 ['Uji Ingatan / recall','3 XP per jawaban benar pada kosakata berbeda per hari; maksimal 20 (60 XP/hari). Recall kata yang sama menunggu 1 jam.'],
 ['Grammar pembelajaran','15 XP bila ketiga jawaban benar; maksimal 5 materi berbeda per hari (75 XP).'],
 ['Matching, Susun Kalimat, Listening','10 XP per aktivitas dengan nilai ≥80; maksimal 2 target berbeda per jenis per hari (20 XP/jenis).'],
 ['Kuis Cerita Kerja','12 XP dengan nilai ≥80; maksimal 2 cerita berbeda per hari (24 XP).'],
 ['Kuis perbedaan kosakata lama','5 XP dengan nilai ≥80; maksimal 5 target berbeda per hari (25 XP).'],
 ['Hanzi · Pinyin','Selesaikan 100 soal: 1 XP per jawaban benar, maksimal 100 XP per paket sepanjang waktu. Ulangan hanya selisih peningkatan skor terbaik.'],
 ['Bank Sinonim & Antonim','Selesaikan seluruh bank: 1 XP per jawaban benar, maksimal 37 XP (Bank 10: 36) per bank sepanjang waktu. Ulangan hanya selisih skor terbaik.'],
 ['Latihan cepat Sinonim & Antonim','5 XP setelah seluruh soal dijawab dan nilai ≥80; maksimal 3 susunan pasangan berbeda per hari (15 XP).'],
 ['Latihan Kosakata, Grammar, Terjemahan di Ujian','Seluruh soal dijawab dan nilai ≥80: floor(nilai × 15 / 100) XP. Maksimal 15 XP per jenis, jalur, dan level sepanjang waktu; ulangan hanya selisih peningkatan.'],
 ['Assessment mingguan HSK / pekerjaan','Seluruh soal dijawab dan lulus: floor(nilai × 20 / 100) XP. Maksimal 20 XP per jalur per minggu; ulangan hanya selisih peningkatan.'],
 ['HSK mode belajar / simulasi penuh','Seluruh soal dijawab dan lulus: floor(nilai × 30 / 100) XP. Maksimal 30 XP per kode soal, terpisah untuk belajar dan simulasi; ulangan hanya selisih peningkatan.'],
 ['HSK per keterampilan','Seluruh soal dijawab dan lulus: floor(nilai × 15 / 100) XP. Maksimal 15 XP per kode soal dan keterampilan; ulangan hanya selisih peningkatan.'],
 ['Ujian naik level','40 XP ketika lulus dengan seluruh jawaban lengkap; satu kali per level yang diuji.'],
 ['Tanpa XP','Placement, diagnostik awal, Gudang Kesalahan, membuka katalog/PDF, menyimpan materi, audio/lagu, rekaman speaking, waktu halaman terbuka, badge, serta bonus misi tidak memberi XP tambahan. Misi memakai XP aktivitas asal.']
];
// Caller must run inside the same trusted transaction as the completed activity.
// Stable cumulative chunk IDs enforce a lifetime best ceiling even across tabs.
export async function grantBestXp(t,uid,activity,target,points,now){
 points=Math.max(0,Math.floor(points));if(!points)return 0;
 const prefix=createHash('sha256').update(activity+'|'+target).digest('hex')+':';
 const old=await t.get('SELECT COALESCE(SUM(amount),0) AS n FROM lc_xp WHERE user_id=? AND activity=? AND substr(target_id,1,?)=?',[uid,activity,prefix.length,prefix]);
 let total=Number(old.n),earned=0;
 while(total<points){const amount=Math.min(15,points-total),end=total+amount,key=prefix+end;
 await t.run('INSERT INTO lc_xp(user_id,day,activity,target_id,amount,created_at) VALUES(?,?,?,?,?,?) ON CONFLICT(user_id,day,activity,target_id) DO NOTHING',[uid,learningDay(now),activity,key,amount,now]);earned+=amount;total=end;}
 return earned;
}
export async function grantExamXp(t,s,score,passed,complete,now,official){
 if(!passed||!complete)return 0;
 let activity,target,cap;
 if(official){if(official.purpose==='mistakes')return 0;
 if(official.purpose==='promotion'){activity='exam_promotion';target=String(s.level);cap=40;score=100;}
 else if(s.mode==='hsk_section'){activity='exam_skill';target=official.paper+':'+official.section;cap=15;}
 else if(['hsk_learning','hsk_simulation'].includes(s.mode)){activity='exam_simulation';target=s.mode+':'+official.paper;cap=30;}else return 0;
 }else if(s.mode==='weekly'){activity='exam_weekly';target=s.track+':'+s.week;cap=20;}
 else if(['random30','random100','grammar','translation'].includes(s.mode)){activity='exam_practice';target=s.mode+':'+s.track+':'+s.level;cap=15;if(score<80)return 0;}else return 0;
 return grantBestXp(t,s.user_id,activity,target,Math.floor(Number(score)*cap/100),now);
}
