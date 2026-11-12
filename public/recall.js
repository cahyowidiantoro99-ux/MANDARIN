import {createFlashcardQueue} from './challenge-queue.js';
import {wireSpeech,speakerIcon} from './speech.js';

export async function mountRecall({api,shell,esc,root,toast,cleanup,packages,user},arg=''){
 const queue=createFlashcardQueue(target=>api('/learn/challenges',{method:'POST',body:{kind:'recall',target}}));
 let disposed=false,audio,words=[],index=0,correct=0,answered=0,session=null,pid=null,starting=false,busy=false,timer=null,last=Date.now();
 async function beat(complete=false){if(!session||busy)return;busy=true;try{const r=await api('/learning/'+session.id+'/heartbeat',{method:'POST',body:{active:document.visibilityState==='visible'&&Date.now()-last<60000,complete}});if(r.closed)session=null;}finally{busy=false;}}
 async function activity(e){if(!root.contains(e.target))return;last=Date.now();if(session||starting||!pid||disposed)return;starting=true;try{session=await api('/learning/start',{method:'POST',body:{package_id:pid}});if(disposed){await beat(true);return;}timer=setInterval(()=>{void beat().catch(()=>{});},15000);}catch(error){if(!disposed)toast(error.message);}finally{starting=false;}}
 ['pointerdown','keydown'].forEach(e=>document.addEventListener(e,activity,{passive:true}));
 cleanup(()=>{disposed=true;queue.clear();audio?.();clearInterval(timer);['pointerdown','keydown'].forEach(e=>document.removeEventListener(e,activity));void beat(true).catch(()=>{});});
 const query=new URLSearchParams({queue:'recall'});
 if(arg.startsWith('package-'))query.set('package',arg.slice(8));
 else if(arg.startsWith('hsk-')){query.set('track','hsk');query.set('level',arg.slice(4));}
 if(arg.startsWith('work-')){const [theme,department,difficulty]=arg.slice(5).split('~');query.set('track','work');query.set('theme',theme);if(department)query.set('department',decodeURIComponent(department));if(difficulty)query.set('difficulty',difficulty);}
 if(arg==='saved')query.set('saved','1');
 const deck=await api('/learn/deck?'+query);if(disposed)return;words=deck.words;if(words.length){pid=deck.package?.id;if(!pid&&packages){const ps=await packages();if(disposed)return;pid=ps.find(p=>p.word_count&&p.track===(query.get('track')||'hsk')&&(p.track==='work'||Number(p.level)===Number(query.get('level')||user.placement_level||1)))?.id;}}
 const speak=text=>`<button class="speak-button" data-speak="${encodeURIComponent(text)}" aria-label="Dengarkan pelafalan" aria-pressed="false">${speakerIcon}<span>Dengarkan</span></button>`;
 const render=body=>{if(disposed)return;audio?.();shell('learning','Uji Ingatan',`<div class="lc recall-page"><a href="#learning">← Pusat Pembelajaran</a><header class="recall-heading"><div><span class="lc-tag">UJI INGATAN</span><h1>Uji Ingatan</h1><p>Ingat arti tanpa membuka jawaban. Hasil uji ingatan membantu mengukur penguasaan.</p></div><img src="/exam-skills.webp" width="560" height="420" alt="" decoding="async"></header>${body}</div>`);audio=wireSpeech(root,{notify:toast});};
 async function next(){
  if(disposed)return;
  if(index>=words.length){await beat(true);if(disposed)return;render(`<section class="panel lc-finish"><h2>${words.length?'Uji Ingatan selesai':'Belum ada kosakata yang siap diuji'}</h2><p>${words.length?`${correct} benar dari ${answered} jawaban.`:'Tandai flashcard terlebih dahulu. Kosakata yang baru diuji tersedia kembali setelah satu jam.'}</p><a class="btn" href="#learning">Kembali ke Pembelajaran →</a></section>`);return;}
  const word=words[index];
  if(!root.querySelector('.recall-page'))render('<section class="panel"><p role="status">Menyiapkan Uji Ingatan…</p></section>');
  try{
   const q=await queue.take(word.id);if(disposed)return;if(words[index+1])void queue.prepare(words[index+1].id).catch(()=>{});
   render(`<div class="recall-progress"><strong>${index+1} / ${words.length}</strong><span>${correct} benar</span></div><progress max="${words.length}" value="${index}" aria-label="Progres recall"></progress><section class="panel lc-recall"><h2>Uji Ingatan · Ingat tanpa melihat arti</h2><h3 class="hanzi" lang="zh" data-learning-content>${esc(word.hanzi)}</h3><p class="pinyin recall-answer-pinyin" id="recall-answer-pinyin" data-learning-content hidden></p>${speak(word.hanzi)}<div class="recall-options">${q.options.map(o=>`<button class="btn secondary" data-recall="${o.id}"><span data-learning-content>${esc(o.label)}</span></button>`).join('')}</div><p id="recall-feedback" role="status"></p><button class="btn" id="recall-next" hidden>Berikutnya →</button></section>`);
   const buttons=[...root.querySelectorAll('[data-recall]')],feedback=root.querySelector('#recall-feedback'),advance=root.querySelector('#recall-next');
   buttons.forEach(button=>button.onclick=async()=>{
    buttons.forEach(b=>b.disabled=true);button.classList.add('recall-pending');feedback.textContent='Memeriksa jawaban…';
    try{
     const result=await api('/learn/challenges/'+q.id+'/submit',{method:'POST',body:{choice:button.dataset.recall}});if(disposed)return;
     button.classList.remove('recall-pending');answered++;correct+=Number(result.correct);
     const reading=root.querySelector('#recall-answer-pinyin');reading.textContent=word.pinyin||q.word?.pinyin||'';reading.hidden=!reading.textContent;
     buttons.forEach(b=>{const right=b.dataset.recall===result.answer;b.classList.add(right?'recall-correct':b===button?'recall-wrong':'recall-other');if(right)b.insertAdjacentHTML('beforeend','<span> · ✓ Jawaban benar</span>');});
     feedback.className=result.correct?'recall-feedback correct':'recall-feedback wrong';feedback.textContent=result.feedback;
     advance.hidden=false;advance.onclick=()=>{advance.disabled=true;index++;void next();};
    }catch(error){if(disposed)return;button.classList.remove('recall-pending');feedback.textContent=error.message;buttons.forEach(b=>b.disabled=false);}
   });
  }catch(error){if(disposed)return;render(`<section class="panel"><p role="alert">${esc(error.message)}</p><button class="btn" id="recall-retry">Coba lagi</button><a class="btn secondary" href="#learning">Kembali</a></section>`);root.querySelector('#recall-retry').onclick=next;}
 }
 await next();
}
