const labels={weekly:'Ujian mingguan',placement:'Placement awal',diagnostic:'Diagnostik kerja',levelup:'Ujian naik level',hsk_simulation:'Simulasi HSK penuh',hsk_learning:'HSK mode belajar',hsk_section:'Latihan bagian HSK',hsk_mistakes:'Latihan soal salah',random30:'Latihan acak 30',random100:'Latihan acak 100',grammar:'Latihan grammar',translation:'Latihan terjemahan'};
const examIcons={
 calendar:'M4 5h16v17H4z M8 2v6 M16 2v6 M4 10h16 M8 16l3 3 6-6',
 paper:'M5 2h14v21H5z M8 7h8 M8 11h8 M8 15h8 M8 19h5',
 book:'M12 5v17 M12 5Q6 1 2 4v16q5-2 10 2 5-4 10-2V4q-4-3-10 1',
 grammar:'M2 5h20 M2 12h20 M2 19h20 M7 2v6 M17 9v6 M9 16v6',
 translation:'M3 3h18v18H3z M6 7h8 M10 5v2 M7 8q1 6 7 7 M13 8q-1 5-6 7 M14 18l3-7 3 7 M15 16h4',
 clock:'M12 7v5l4 2 M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',
 trophy:'M7 3h10v7a5 5 0 0 1-10 0z M7 5H3v4q0 4 5 4 M17 5h4v4q0 4-5 4 M12 15v6 M7 22h10'
};
const examIcon=name=>`<svg viewBox="0 0 24 26" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${examIcons[name]||examIcons.paper}"/></svg>`;
const sections=[['listening','Listening'],['reading','Reading'],['writing','Writing']];
const menus=[['evaluation','Assessment Mingguan','calendar'],['simulation','Simulasi HSK','paper'],['vocabulary','Latihan Kosakata','book'],['grammar','Latihan Grammar','grammar'],['translation','Latihan Terjemahan','translation']];

export async function mountExamCenter({api,shell,esc,root,user,cleanup},view='center'){
 let disposed=false,tab='evaluation',level=Number(user.placement_level||1),paperId='',skill='listening',difficulty='easy',simMode='hsk_simulation',practiceTrack='hsk',practiceMode='random30';
 cleanup(()=>{disposed=true;});
 const [d,c]=await Promise.all([api('/dashboard'),api('/hsk-center')]);
 if(disposed)return;
 level=Number(d.profile.placement_level||1);
 const $=selector=>root.querySelector(selector),all=selector=>[...root.querySelectorAll(selector)];
 const status=r=>r.grading_status==='cancelled'||r.status==='void'?'Dibatalkan':r.grading_status==='pending'||r.grading_status==='grading'?'Menunggu penilaian':r.status==='active'?'Sedang dikerjakan':r.score!=null?(r.passed?'Lulus':'Belum lulus'):'Selesai';
 const startButton=(mode,track='hsk',text='Mulai →')=>`<button class="btn" data-exam-start="${mode}" data-track="${track}">${text}</button>`;
 const image=name=>`<img class="exam-mascot" src="/${name}.webp" alt="" width="480" height="360" decoding="async">`;

 function promotion(){
  const p=c.promotion;
  return `<section class="panel exam-promotion"><span class="pill gold">Evaluasi internal ECB</span><h2>Uji penguasaan HSK ${p.level||'—'} → belajar HSK ${p.target_level||'—'}</h2><p>Ujian memakai paket cadangan pada level saat ini. Lulus berarti siap memulai materi satu tingkat berikutnya.</p><ul><li>Nilai total minimal ${p.policy.total}/100 dan setiap keterampilan minimal ${p.policy.section}/100.</li><li>Setelah lulus, Anda dapat langsung mencoba ujian naik level berikutnya dalam minggu yang sama.</li><li>Jika belum lulus, Anda dapat langsung mengulang dengan paket cadangan berbeda.</li><li>Jawaban tulis menunggu penilaian tidak dianggap nol; keputusan menunggu nilai lengkap.</li></ul>${p.eligible?startButton('levelup','hsk','Mulai ujian naik level →'):`<div class="notice">${p.reasons.map(reason=>`<p>${esc(reason)}</p>`).join('')}</div>`}<p class="muted mt">Ini kebijakan internal ECB, bukan sertifikasi HSK. XP dan pilihan Hafal tidak menentukan kelulusan. Setiap kelulusan menaikkan satu tingkat.</p></section>`;
 }

 function evaluation(){
  return `${!d.profile.placement_level?`<section class="panel"><h2>Mulai dengan placement awal</h2><p>Placement dilakukan satu kali untuk menentukan titik mulai belajar.</p>${startButton('placement','hsk','Mulai / lanjutkan placement →')}</section>`:''}<div class="exam-weekly-grid">${['hsk','work'].map(track=>{
   const result=d.weekly[track],active=d.history.find(r=>r.mode==='weekly'&&r.track===track&&r.status==='active');
   const needsPlacement=track==='hsk'&&!d.profile.placement_level;
   const title=track==='hsk'?'Assessment Mingguan HSK':'Assessment Mingguan Kosakata Kerja';
   const state=result?(result.passed?'Selesai · lulus':'Selesai · belum lulus'):active?'Sedang dikerjakan':needsPlacement?'Placement diperlukan':'Siap dikerjakan';
   const button=result?'<a class="btn" href="#dashboard">Lihat hasil di Dasbor →</a>':active?`<a class="btn" href="#exam/${active.id}">Lanjutkan assessment →</a>`:needsPlacement?'<a class="btn" href="#dashboard">Selesaikan placement →</a>':startButton('weekly',track,track==='hsk'?'Mulai Assessment HSK →':'Mulai Assessment Kosakata →');
   return `<article class="exam-illustrated exam-weekly-card"><div class="exam-art">${image(track==='hsk'?'exam-hsk':'exam-work')}</div><div class="exam-card-copy"><span class="exam-weekly-label">${examIcon('calendar')}Assessment Mingguan</span><h2>${title}</h2><p>${track==='hsk'?`Evaluasi pemahaman HSK sesuai level belajar Anda${d.profile.placement_level?' · HSK '+d.profile.placement_level:''}.`:'Evaluasi penguasaan kosakata umum dan departemen Anda di ECB.'}</p><ul class="exam-facts"><li>${examIcon('clock')}<span>30 soal · 25 menit</span></li><li>${examIcon('trophy')}<span>Ambang kelulusan ${track==='hsk'?c.promotion.policy.total:80}/100</span></li></ul><span class="pill ${result&&!result.passed?'gold':needsPlacement?'':'green'}">${state}</span>${result?`<p class="exam-score">Nilai: ${result.score}</p>`:''}${button}</div></article>`;
  }).join('')}</div><div class="exam-foot-actions"><a href="#levelup">Ujian Naik Level →</a><a href="#dashboard">Riwayat ujian dan progres →</a></div>${d.profile.baseline_work==null?`<details class="panel mt"><summary>Diagnostik kosakata pekerjaan</summary><p>Mengukur kemampuan awal kosakata kerja secara terpisah.</p>${startButton('diagnostic','work','Mulai diagnostik →')}</details>`:''}`;
 }

 function simulations(){
  const papers=c.papers.filter(p=>p.level===level&&p.difficulty===difficulty);
  const selected=papers.find(p=>p.id===paperId&&p.available)||papers.find(p=>p.available);paperId=selected?.id||'';if(selected&&!selected.counts[skill])skill='listening';
  const cards=selected?`<div class="exam-sim-grid"><article class="exam-illustrated exam-sim-card"><div class="exam-art">${image('exam-hsk')}</div><div class="exam-card-copy"><h2>Simulasi Penuh</h2><p>Kerjakan seluruh bagian ujian dalam satu sesi.</p><small>${esc(selected.id)} · ${selected.total} soal · ±${selected.minutes} menit</small><button class="btn" data-paper="${esc(selected.id)}" data-full="true">Mulai simulasi penuh →</button></div></article><article class="exam-illustrated exam-sim-card"><div class="exam-art">${image('exam-skills')}</div><div class="exam-card-copy"><h2>Per Keterampilan</h2><p>Fokus berlatih sesuai keterampilan yang dipilih.</p><div class="exam-skill-tabs">${sections.filter(([k])=>selected.counts[k]>0).map(([k,label])=>`<button type="button" class="btn secondary" data-select-skill="${k}" aria-pressed="${skill===k}">${label}</button>`).join('')}</div><small>${esc(selected.id)} · ${selected.counts[skill]} soal</small><button class="btn" data-section="${skill}">Mulai per keterampilan →</button></div></article></div>`:'';
  const diffLabels={easy:'Mudah',medium:'Sedang',hard:'Sulit'};
  return '<section class="panel exam-sim-panel"><div class="exam-section-title"><h2>Simulasi HSK</h2><p>Pilih level dan tingkat kesulitan, lalu mulai atau lanjutkan paket.</p></div><div class="filters"><label>Level HSK<select id="exam-list-level">'+[1,2,3,4,5,6].map(n=>'<option value="'+n+'" '+(n===level?'selected':'')+'>HSK '+n+'</option>').join('')+'</select></label><label>Tingkat kesulitan<select id="exam-difficulty">'+Object.entries(diffLabels).map(([k,v])=>'<option value="'+k+'" '+(k===difficulty?'selected':'')+'>'+v+'</option>').join('')+'</select></label><label>Mode<select id="exam-sim-mode"><option value="hsk_simulation" '+(simMode==='hsk_simulation'?'selected':'')+'>Simulasi penuh · bertimer</option><option value="hsk_section" '+(simMode==='hsk_section'?'selected':'')+'>Per keterampilan · '+skill+'</option><option value="hsk_learning" '+(simMode==='hsk_learning'?'selected':'')+'>Mode belajar · tanpa timer bagian</option></select></label></div><p class="muted">Kesulitan mengikuti pengelompokan internal ECB. Paket naik level dipisahkan dari simulasi.</p>'+cards+'<div class="hsk-paper-list">'+papers.map((p,index)=>{const attempts=c.attempts.filter(a=>a.paper_id===p.id&&a.purpose!=='promotion'),active=attempts.find(a=>a.status==='active'&&Number(a.deadline)>Date.now()/1000),last=active||attempts[0];return '<article class="hsk-paper-row"><span class="hsk-paper-number">'+String(index+1).padStart(2,'0')+'</span><div class="hsk-paper-info"><h3><button type="button" class="hsk-select-paper" data-select-paper="'+esc(p.id)+'" aria-pressed="'+(paperId===p.id)+'">HSK '+level+' · '+esc(p.id)+'</button></h3><small>'+ (p.available?'Listening '+p.counts.listening+' · Reading '+p.counts.reading+(p.counts.writing?' · Writing '+p.counts.writing:'')+' · ±'+p.minutes+' menit':'Materi sedang diverifikasi')+'</small></div><span class="pill '+(last?.passed?'green':'')+'">'+(last?status(last):'Belum dikerjakan')+'</span><div class="hsk-paper-actions">'+(!p.available?'<span class="muted">Belum tersedia</span>':active?'<a class="btn secondary" href="#exam/'+active.id+'">Lanjutkan →</a>':'<button class="btn" data-paper="'+esc(p.id)+'">Mulai →</button>')+(p.available&&last&&!active?'<button class="btn secondary" data-paper="'+esc(p.id)+'">Sesi baru</button>':'')+'</div></article>';}).join('')+'</div><a class="exam-history-link" href="#dashboard">Lihat riwayat simulasi di Dasbor →</a></section>';
 }

 function practice(){
  const vocabulary=tab==='vocabulary';
  const title=menus.find(([key])=>key===tab)[1];
  const copy={vocabulary:'Perkaya penguasaan kosakata Mandarin.',grammar:'Pahami dan kuasai pola tata bahasa.',translation:'Latih kemampuan menerjemahkan Mandarin ↔ Indonesia.'}[tab];
  return `<section class="panel exam-practice-panel"><div class="filters"><label>Jalur latihan<select id="exam-track"><option value="hsk" ${practiceTrack==='hsk'?'selected':''}>Mandarin umum · HSK ${d.profile.placement_level||1}</option><option value="work" ${practiceTrack==='work'?'selected':''}>Kosakata pekerjaan</option></select></label>${vocabulary?`<label>Jumlah soal<select id="exam-practice-mode"><option value="random30" ${practiceMode==='random30'?'selected':''}>30 soal</option><option value="random100" ${practiceMode==='random100'?'selected':''}>100 soal</option></select></label>`:''}</div><article class="exam-illustrated exam-practice-banner exam-practice-${tab}"><div class="exam-art">${image(({vocabulary:'exam-vocab',grammar:'exam-grammar',translation:'exam-translation'})[tab])}</div><div class="exam-card-copy"><span class="exam-practice-icon">${examIcon(({vocabulary:'book',grammar:'grammar',translation:'translation'})[tab])}</span><h2>${title}</h2><p>${copy}</p><small>${practiceTrack==='hsk'?'Sesuai level belajar HSK Anda':'Kosakata umum dan departemen Anda'} · Latihan mandiri</small>${practiceTrack==='hsk'&&!d.profile.placement_level?'<a class="btn" href="#dashboard">Selesaikan placement →</a>':startButton(vocabulary?practiceMode:tab,practiceTrack,'Mulai latihan →')}</div></article><a class="exam-history-link" href="#dashboard">Lihat riwayat latihan di Dasbor →</a></section>`;
 }

 function draw(){
  if(disposed)return;
  const active=d.history.find(r=>r.status==='active');
  const heading=view==='promotion'?'Ujian Naik Level':'Pusat Ujian ECB';
  shell(view==='promotion'?'dashboard':'examination',view==='promotion'?'Ujian Naik Level':'Ujian',`<div class="exam-center exam-redesign"><header class="exam-hero"><div class="exam-hero-copy"><div><h1>${heading}</h1><p>${view==='promotion'?'Uji penguasaan level saat ini untuk melanjutkan belajar.':'Pilih jenis ujian atau latihan Anda.'}</p></div></div><svg class="exam-pavilion" viewBox="0 0 260 110" fill="none" aria-hidden="true"><path d="M0 110q30-50 70-26 32-56 69-25 40-50 80-21 27-6 41 5v67" fill="currentColor" opacity=".18"/><g stroke="currentColor" stroke-width="3" opacity=".42"><path d="M165 12v-8m-42 36q24-5 42-28 18 23 42 28z M133 43v20m64-20v20 M113 70q30-4 52-18 22 14 52 18z M130 73v31m70-31v31 M153 104V80h24v24 M116 104h98"/></g></svg></header>${active?`<div class="notice exam-active-session"><strong>Sesi belum selesai</strong><span>${labels[active.mode]||esc(active.mode)} · HSK ${active.level}</span><a class="btn secondary" href="#exam/${active.id}">Lanjutkan sesi →</a></div>`:''}<div id="exam-error" role="alert"></div>${view==='promotion'?promotion():`<nav class="exam-menu-grid" aria-label="Jenis ujian dan latihan">${menus.map(([key,title,icon])=>`<button type="button" data-exam-tab="${key}" aria-pressed="${tab===key}">${examIcon(icon)}<span>${title}</span></button>`).join('')}</nav>${tab==='evaluation'?evaluation():tab==='simulation'?simulations():practice()}`}</div>`);
  all('[data-exam-tab]').forEach(button=>button.onclick=()=>{tab=button.dataset.examTab;draw();root.querySelector(`[data-exam-tab="${tab}"]`)?.focus({preventScroll:true});});
  all('[data-exam-start]').forEach(button=>button.onclick=()=>start(button,{mode:button.dataset.examStart,track:button.dataset.track}));
  all('[data-paper]').forEach(button=>button.onclick=()=>start(button,{mode:button.dataset.full?'hsk_simulation':simMode,track:'hsk',paper_id:button.dataset.paper,...(simMode==='hsk_section'&&!button.dataset.full?{section:skill}:{})}));
  all('[data-select-paper]').forEach(button=>button.onclick=()=>{paperId=button.dataset.selectPaper;draw();});
  all('[data-section]').forEach(button=>button.onclick=()=>start(button,{mode:'hsk_section',track:'hsk',paper_id:paperId,section:button.dataset.section}));
  all('[data-exam-level]').forEach(button=>button.onclick=()=>{level=Number(button.dataset.examLevel);paperId='';skill='listening';draw();root.querySelector(`[data-exam-level="${level}"]`)?.focus({preventScroll:true});});
  all('[data-select-skill]').forEach(button=>button.onclick=()=>{skill=button.dataset.selectSkill;simMode='hsk_section';draw();root.querySelector(`[data-select-skill="${skill}"]`)?.focus({preventScroll:true});});
  const wireSelect=(selector,update)=>{const input=$(selector);if(input)input.onchange=event=>{update(event.target.value);draw();$(selector)?.focus({preventScroll:true});};};
  wireSelect('#exam-list-level',value=>{level=Number(value);});
  wireSelect('#exam-difficulty',value=>{difficulty=value;});
  wireSelect('#exam-practice-paper',value=>{paperId=value;});
  wireSelect('#exam-sim-mode',value=>{simMode=value;});
  wireSelect('#exam-track',value=>{practiceTrack=value;});
  wireSelect('#exam-practice-mode',value=>{practiceMode=value;});
 }

 async function start(button,body){
  button.disabled=true;$('#exam-error').textContent='';
  try{const q=await api('/exams',{method:'POST',body});if(!disposed)location.hash='exam/'+q.id;}
  catch(error){if(!disposed){$('#exam-error').className='notice error';$('#exam-error').textContent=error.message;button.disabled=false;}}
 }
 draw();
}
