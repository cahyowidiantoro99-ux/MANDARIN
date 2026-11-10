import {bookmarkButton,wireBookmarks} from './bookmarks.js';
import {materialDownload,wireMaterialDownload} from './material-download.js';
import {wireSpeech,speakerIcon} from './speech.js';

const levels=['1','2','3','4','5','6','7-9'];
const levelOptions='<option value="">Semua level HSK</option>'+levels.map(x=>'<option value="'+x+'">HSK '+x+'</option>').join('');
const typeOptions='<option value="">Semua hubungan</option><option value="S">Sinonim dekat</option><option value="A">Antonim / kontras</option>';
const titles={'vocab-atlas':'Katalog Kosakata HSK 1–9','word-pairs':'Pasangan Kata 同义词／反义词','pair-practice':'Latihan Sinonim & Antonim','pair-mistakes':'Gudang Kesalahan · Pasangan Kata'};
const source='<details class="panel mt"><summary>Sumber dan cakupan</summary><p>Daftar GF 0025–2021 melalui <a href="https://github.com/ivankra/hsk30">ivankra/hsk30</a>. HSK 7–9 merupakan satu kelompok. Arti Indonesia berasal dari Atlas Hanzi dan memakai rujukan <a href="https://www.mdbg.net/chinese/dictionary?page=cc-cedict">CC-CEDICT</a>. Kandidat kamus memakai <a href="https://github.com/jaaack-wang/Chinese-Synonyms">Chinese-Synonyms</a> dan <a href="https://github.com/guotong1988/chinese_dictionary">chinese_dictionary</a>. Pinyin konteks berasal dari katalog atau pypinyin. Contoh berasal dari <a href="https://github.com/saymei/zhongdex">Zhongdex</a>, <a href="https://gushichinese.com/hsk-3.0/downloads">Gushi</a>, dan contoh orisinal. Data adaptasi dan terjemahan menggunakan <a href="https://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA 4.0</a>. Sebagian terjemahan menggunakan bantuan mesin dan bergantung pada konteks.</p></details>';

export async function mountVocabulary({api,shell,esc,root,cleanup,toast},page,arg){
  const pairMode=page==='word-pairs',learning=pairMode||page==='vocab-atlas';
  let disposed=false,request=0,timer;
  let cleanupAudio;const stopBookmarks=wireBookmarks(root,{api,toast});
  cleanup(()=>{stopBookmarks();disposed=true;clearTimeout(timer);cleanupAudio?.();});
  const nav=learning?'<a href="#learning">← Pusat Pembelajaran</a> · <a href="#vocab-atlas">Katalog Kosakata</a>':'<a href="#learning">← Zona Interaktif</a> · <a href="#pair-practice">Latihan Sinonim &amp; Antonim</a> · <a href="#learning-mistakes">Gudang Kesalahan</a>';
  shell('learning',titles[page],'<div>'+nav+'</div><h1 class="mt">'+esc(titles[page])+'</h1><div id="vocab-host"></div>'+source);
  if(page==='vocab-atlas'){root.querySelector('#vocab-host').insertAdjacentHTML('beforebegin',materialDownload('kosakata'));wireMaterialDownload(root);}
  const host=root.querySelector('#vocab-host'), select=(name,options)=>'<select aria-label="'+name+'">'+options+'</select>';
  cleanupAudio=wireSpeech(host);
  const audio=text=>'<button type="button" class="vocab-audio speak-button" data-speak="'+esc(encodeURIComponent(text))+'" aria-label="Dengarkan '+esc(text)+'" aria-pressed="false" hidden><svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M3 9h4l5-4v14l-5-4H3zM16 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/></svg></button>';
  const spoken=(text,markup)=>'<div class="vocab-spoken">'+markup+audio(text)+'</div>';
  const example=([hanzi,pinyin,meaning])=>'<div class="notice mt">'+spoken(hanzi,'<strong lang="zh">'+esc(hanzi)+'</strong>')+'<div class="pinyin">'+esc(pinyin)+'</div><div>'+esc(meaning)+'</div></div>';
  const pair=p=>{
    const word=w=>'<div>'+spoken(w.hanzi,'<strong lang="zh">'+esc(w.hanzi)+'</strong>')+'<div class="pinyin">'+esc(w.pinyin)+'</div><div>'+esc(w.meaning)+'</div></div>';
    const relation=p.type==='S'?'Sinonim dekat':'Antonim / kontras';
    return '<article class="panel"><span class="pill '+(p.curated?'green':'gold')+'">'+relation+' · '+(p.curated?'Terkurasi':'Kandidat kamus')+'</span><div class="vocab-relation mt">'+word(p.words[0])+'<b aria-label="'+relation+'">'+(p.type==='S'?'=':'X')+'</b>'+word(p.words[1])+'</div>'+
      (p.context?'<p class="mt">'+esc(p.context)+'<br><small>'+esc(p.contextReading)+'</small></p>':'')+(p.note?'<p>'+esc(p.note)+'</p>':'')+(p.examples.length?'<h4 class="mt">'+(p.joint?'Contoh kedua kata':'Contoh penggunaan per kata')+'</h4>'+p.examples.map(example).join(''):'')+'</article>';
  };
  const card=w=>'<article class="panel bookmark-card">'+bookmarkButton('atlas-vocab',w.bookmark_id)+'<span class="pill">HSK '+esc(w.level)+'</span>'+spoken(w.hanzi,'<h3 lang="zh">'+esc(w.hanzi)+'</h3>')+'<div class="pinyin">'+esc(w.pinyin)+'</div><p>'+esc(w.meaning)+'</p>'+(w.example?example(w.example):'')+
    (w.link?'<a href="#word-pairs/'+encodeURIComponent(w.link)+'">Lihat Pasangan Kata →</a>':'')+'</article>';

  if(learning){
    host.innerHTML='<div class="panel vocab-controls"><input type="search" aria-label="Cari kosakata" placeholder="Cari Hanzi, pinyin, atau arti Indonesia">'+select('Level HSK',levelOptions)+(pairMode?select('Jenis hubungan',typeOptions):'')+'</div><div id="vocab-results" class="mt"></div>';
    const input=host.querySelector('input'),[level,type]=host.querySelectorAll('select'),results=host.querySelector('#vocab-results');
    let exact=pairMode&&arg?arg:'';
    input.value=exact;if(!pairMode&&arg){try{input.value=decodeURIComponent(arg);}catch{input.value=arg;}}
    async function load(offset=0){
      const token=++request;
      results.setAttribute('aria-busy','true');
      const query=new URLSearchParams({view:pairMode?'pairs':'words',q:input.value,level:level.value,type:type?.value||'',page:offset,word:exact});
      try{
        const data=await api('/vocabulary/list?'+query);
        if(disposed||token!==request)return;
        results.innerHTML='<p role="status">'+data.total.toLocaleString('id-ID')+' hasil</p><div class="vocab-results">'+data.rows.map(pairMode?pair:card).join('')+'</div>'+
          (data.total>24?'<div class="split mt"><button class="btn secondary" data-prev>Sebelumnya</button><span>Halaman '+(data.page+1)+' / '+Math.ceil(data.total/24)+'</span><button class="btn secondary" data-next>Berikutnya</button></div>':'');
        for(const [selector,disabled,delta] of [['[data-prev]',data.page===0,-1],['[data-next]',(data.page+1)*24>=data.total,1]]){
          const button=results.querySelector(selector);
          if(button){button.disabled=disabled;button.onclick=()=>{load(data.page+delta);host.scrollIntoView({block:'start'});};}
        }
      }catch(error){if(!disposed&&token===request)results.innerHTML='<p role="alert">'+esc(error.message)+'</p>';}
      finally{if(token===request)results.removeAttribute('aria-busy');}
    }
    input.oninput=()=>{exact='';request++;clearTimeout(timer);timer=setTimeout(load,180);};
    host.querySelectorAll('select').forEach(s=>s.onchange=()=>{clearTimeout(timer);load();});
    await load();
    return;
  }

  let run,lastConfig;
  async function start(config,button){
    button.disabled=true;
    try{
      run=await api('/vocabulary/attempts',{method:'POST',body:config});
      if(disposed)return;
      lastConfig=config;question();
    }catch(error){if(!disposed){host.querySelector('[role=alert]').textContent=error.message;button.disabled=false;}}
  }
  function question(feedback=false){
    const q=run.question;
    if(feedback){
      const last=run.last;
      host.innerHTML='<p role="status"><strong>'+(last.correct?'✓ Benar':'Jawaban benar: '+esc(last.answer))+'</strong> · Pilihan Anda: '+esc(last.choice)+'</p>'+pair(last.pair)+
        (q?'<button class="btn mt" id="vocab-next">Soal berikutnya →</button>':'<h2 class="mt">Skor '+run.score+' / '+run.total+'</h2><div class="split"><button class="btn" id="vocab-repeat">Ulangi latihan</button><a href="#pair-mistakes">Lihat Gudang Kesalahan</a></div><p role="alert"></p>');
      host.querySelector('#vocab-next')?.addEventListener('click',()=>question());
      host.querySelector('#vocab-repeat')?.addEventListener('click',e=>start(lastConfig,e.currentTarget));
      return;
    }
    host.innerHTML='<section class="panel"><p>Soal '+(run.answered+1)+' / '+run.total+'</p><h2>Cari '+(q.contextual?'kata yang berhubungan':q.type==='S'?'sinonim dekat':'antonim atau kontras')+' untuk <span lang="zh">'+esc(q.from.hanzi)+'</span></h2><p>'+esc(q.from.pinyin)+' · '+esc(q.from.meaning)+'</p><p>'+esc(q.clue)+'</p><div class="vocab-controls">'+q.options.map(w=>'<button type="button" class="btn secondary" lang="zh">'+esc(w)+'</button>').join('')+'</div><p role="alert"></p></section>';
    const buttons=[...host.querySelectorAll('button')];
    buttons.forEach(b=>b.onclick=async()=>{
      buttons.forEach(button=>button.disabled=true);
      try{
        run=await api('/vocabulary/attempts/'+run.id,{method:'PUT',body:{index:run.answered,choice:b.textContent}});
        if(!disposed)question(true);
      }catch(error){if(!disposed){host.querySelector('[role=alert]').textContent=error.message;buttons.forEach(button=>button.disabled=false);}}
    });
  }
  if(page==='pair-mistakes'){
    host.innerHTML='<p role="status">Memuat riwayat…</p>';
    const mistakes=await api('/vocabulary/mistakes');
    if(disposed)return;
    host.innerHTML='<button class="btn" '+(mistakes.some(m=>m.active)?'':'disabled')+'>Ulangi kesalahan aktif</button><p role="alert"></p>'+
      (mistakes.length?mistakes.map(m=>'<section class="mt"><p><strong>'+(m.active?'Perlu diulang':'Sudah diperbaiki')+'</strong> · '+m.count+' kali salah · Jawaban terakhir: '+esc(m.choice)+'</p>'+pair(m.pair)+'</section>').join(''):'<p>Belum ada kesalahan pasangan kata.</p>');
    host.querySelector('button').onclick=e=>start({mode:'review'},e.currentTarget);
    return;
  }
  host.innerHTML='<section class="panel"><h2>Latihan cepat</h2><p>Maksimal 10 soal dari pasangan terkurasi.</p><div class="vocab-controls">'+select('Jenis hubungan',typeOptions)+select('Level HSK',levelOptions)+'<button class="btn" id="vocab-quick">Mulai latihan</button></div></section><section class="panel mt"><h2>10 bank soal tetap</h2><p>Bank 1–9 berisi 37 soal. Bank 10 berisi 36 soal.</p><div class="vocab-controls">'+select('Bank soal',Array.from({length:10},(_,i)=>'<option value="'+(i+1)+'">Bank '+(i+1)+'</option>').join(''))+'<button class="btn" id="vocab-bank">Mulai bank</button></div></section><p role="alert"></p>';
  const [type,level,bank]=host.querySelectorAll('select');
  host.querySelector('#vocab-quick').onclick=e=>start({mode:'quick',type:type.value,level:level.value},e.currentTarget);
  host.querySelector('#vocab-bank').onclick=e=>start({mode:'bank',bank:Number(bank.value)},e.currentTarget);
}
