const normalize=value=>String(value).toLowerCase().normalize('NFD').replace(/[\u0300-\u0304\u030c]/g,'').normalize('NFC');
const symbols={'Kiri–kanan':'⿰','Atas–bawah':'⿱','Tiga bagian horizontal':'⿲','Tiga bagian vertikal':'⿳','Keliling penuh':'⿴','Keliling dari atas':'⿵','Keliling dari bawah':'⿶','Keliling dari kiri':'⿷','Keliling dari kiri atas':'⿸','Keliling dari kanan atas':'⿹','Keliling dari kiri bawah':'⿺','Bertumpuk':'⿻'};
const modes={curated:'Contoh dengan petunjuk',stroke:'Titik atau goresan',left:'Bagian kiri',right:'Bagian kanan',top:'Bagian atas',bottom:'Bagian bawah',overall:'Siluet dan posisi goresan'};
const sources='<details class="panel mt"><summary>Sumber Atlas dan cakupan</summary><p>Daftar 3.000 hanzi mengikuti GF0025-2021. Level 7–9 dikelompokkan. Terjemahan Indonesia berasal dari Atlas sumber dan dapat bergantung pada konteks.</p><p><a href="https://www.moe.gov.cn/jyb_xwfb/moe_2082/siju/yywzxxgls/ztzl_yywzgfbz/202111/t20211118_580755.html">GF0025-2021</a> · <a href="https://github.com/ivankra/hsk30">Daftar digital hanzi dan kosakata</a> · <a href="https://github.com/skishore/makemeahanzi">Make Me a Hanzi</a> (data kamus, LGPL-3.0-or-later) · <a href="https://www.unicode.org/reports/tr38/">Unicode Unihan</a> · <a href="https://www.unicode.org/license.txt">Lisensi Unicode</a></p></details>';
let catalogRequest;
const loadCatalog=api=>catalogRequest??=api('/atlas/catalog').catch(error=>{catalogRequest=null;throw error;});

export async function mountAtlas({api,shell,esc,root,cleanup},route,arg){
  let disposed=false, busy=false;
  cleanup(()=>{disposed=true;});
  const learning=route==='hanzi'||route==='hanzi-compare';
  const [catalog,progress,attempt]=await Promise.all([
    loadCatalog(api),learning?null:api('/atlas/progress'),
    route==='pinyin'&&arg?api('/atlas/attempts/'+encodeURIComponent(arg)):null,
  ]);
  if(disposed)return;
  const rows=catalog.rows, byHanzi=new Map(rows.map(row=>[row.hanzi,row]));
  const title={hanzi:'Katalog Hanzi HSK 1–9','hanzi-compare':'Bentuk Mirip 形近字',pinyin:'Latihan Pinyin','pinyin-mistakes':'Gudang Kesalahan'}[route];
  const nav=learning?'<a class="btn secondary" href="#hanzi">Katalog Hanzi</a><a class="btn secondary" href="#hanzi-compare">Bentuk Mirip</a>':'<a class="btn secondary" href="#pinyin">Latihan Pinyin</a><a class="btn secondary" href="#pinyin-mistakes">Gudang Kesalahan</a>';
  shell(learning?'learning':'examination',title,`<div class="lc atlas"><a class="lc-back" href="#${learning?'learning':'examination'}">← ${learning?'Pusat Pembelajaran':'Pusat Ujian'}</a><header class="lc-journey"><div><div class="section-tag">ATLAS HANZI · 字形与拼音</div><h1>${title}</h1></div></header><div class="split atlas-nav">${nav}</div><p id="atlas-error" role="alert"></p><div id="atlas-body"></div>${sources}</div>`);
  const $=selector=>root.querySelector(selector), host=$('#atlas-body');
  const link=hanzi=>'#hanzi/'+encodeURIComponent(hanzi);
  function examples(row){
    return row.examples.length?`<ul class="atlas-examples">${row.examples.map(e=>`<li><strong lang="zh">${esc(e.word)}</strong> ${esc(e.pinyin||'')} · ${esc(e.meaning_id)}</li>`).join('')}</ul>`:'<p class="muted">Contoh tidak tercantum dalam sumber kosakata.</p>';
  }
  function detail(row){
    return `<article class="panel atlas-word"><div class="hanzi" lang="zh">${esc(row.hanzi)}</div><strong>${esc(row.pinyin.join(' / '))}</strong><p>${esc(row.gloss_id)}</p><small>HSK ${esc(row.level)} · ${esc(row.strokes)} goresan · Trad. ${esc(row.traditional)}</small><p>Radikal ${esc(row.radical)} (${esc(row.radical_form)}) · ${esc(symbols[row.structure]||'')} ${esc(row.structure)}<br>Komponen ${esc(row.components.join(' + ')||'—')} · IDS ${esc(row.ids)}</p>${examples(row)}</article>`;
  }
  function paged(render,size){
    let page=0;
    const list=$('#atlas-list'), count=$('#atlas-count'), prev=$('#atlas-prev'), next=$('#atlas-next');
    function update(reset=false){
      if(reset)page=0;
      const {items,card}=render();
      count.textContent=`${items.length.toLocaleString('id-ID')} hasil · Halaman ${page+1}/${Math.max(1,Math.ceil(items.length/size))}`;
      list.innerHTML=items.slice(page*size,(page+1)*size).map(card).join('')||'<p>Tidak ada hasil.</p>';
      prev.disabled=page===0;next.disabled=(page+1)*size>=items.length;
    }
    prev.onclick=()=>{page--;update();count.scrollIntoView({block:'nearest'});};
    next.onclick=()=>{page++;update();count.scrollIntoView({block:'nearest'});};
    update();
    return ()=>update(true);
  }
  const list='<p id="atlas-count" aria-live="polite"></p><div id="atlas-list" class="atlas-grid"></div><div class="split mt"><button class="btn secondary" id="atlas-prev">Sebelumnya</button><button class="btn secondary" id="atlas-next">Berikutnya</button></div>';
  if(route==='hanzi'){
    let exact=null;
    if(arg){try{exact=byHanzi.get(decodeURIComponent(arg));}catch{}}
    if(exact){host.innerHTML=`<p><a href="#hanzi">← Kembali ke katalog</a></p>${detail(exact)}`;return;}
    host.innerHTML=`<div class="filters"><label>Cari hanzi, pinyin, atau arti<input id="atlas-q" type="search"></label><label>Level<select id="atlas-level"><option value="">Semua level</option>${[1,2,3,4,5,6,'7-9'].map(v=>`<option>${v}</option>`).join('')}</select></label><label>Kelompokkan berdasarkan<select id="atlas-kind"><option value="radical">Radikal</option><option value="components">Komponen</option><option value="structure">Struktur</option><option value="pinyin">Pinyin bernada</option></select></label><label>Kelompok<select id="atlas-value"></select></label></div>${list}`;
    const search=rows.map(r=>normalize([r.hanzi,r.traditional,r.gloss_id,...r.pinyin,...r.examples.flatMap(e=>[e.word,e.pinyin,e.meaning_id])].join(' ')));
    const level=$('#atlas-level'),kind=$('#atlas-kind'),value=$('#atlas-value'),q=$('#atlas-q');
    const values=r=>[].concat(r[kind.value]).filter(Boolean);
    function groups(){
      const counts=new Map();
      for(const r of rows)if(!level.value||r.level===level.value)for(const v of values(r))counts.set(v,(counts.get(v)||0)+1);
      value.innerHTML='<option value="">Semua kelompok</option>'+[...counts].sort(([a],[b])=>a.localeCompare(b,'zh-Hans-u-co-stroke')).map(([v,n])=>`<option value="${esc(v)}">${esc(kind.value==='structure'&&symbols[v]?symbols[v]+' '+v:v)} (${n})</option>`).join('');
    }
    groups();
    const refresh=paged(()=>({items:rows.filter((r,i)=>(!level.value||r.level===level.value)&&(!value.value||values(r).includes(value.value))&&search[i].includes(normalize(q.value.trim()))),card:detail}),24);
    q.oninput=value.onchange=refresh;
    level.onchange=kind.onchange=()=>{groups();refresh();};
    return;
  }
  if(route==='hanzi-compare'){
    const groups=[...catalog.curatedShapes.map(([chars,tip])=>({chars,tip,mode:'curated'})),...catalog.scannedShapes.map(([chars,mode])=>({chars,mode}))];
    const coverage=new Set(groups.flatMap(g=>[...g.chars])).size;
    host.innerHTML=`<p>${coverage} hanzi memiliki pembanding visual. Semua 3.000 tetap tersedia di Katalog.</p><div class="filters"><label>Kemiripan<select id="atlas-mode">${Object.entries(modes).map(([key,label])=>`<option value="${key}">${label}</option>`).join('')}</select></label><label>Cari hanzi atau pinyin<input id="atlas-q" type="search"></label></div><p id="atlas-tip"></p>${list}`;
    const mode=$('#atlas-mode'),q=$('#atlas-q');
    const refresh=paged(()=>{
      const query=normalize(q.value.trim());
      $('#atlas-tip').textContent=catalog.compareModes[mode.value];
      return {items:groups.filter(g=>g.mode===mode.value&&(!query||g.chars.includes(query)||[...g.chars].some(c=>byHanzi.get(c)?.pinyin.some(p=>normalize(p).includes(query))))),card:g=>`<article class="panel"><h2 lang="zh">${esc([...g.chars].join(' · '))}</h2><p>${esc(g.tip||catalog.compareModes[g.mode])}</p><div class="atlas-tiles">${[...g.chars].map(c=>{const row=byHanzi.get(c);return row?`<a class="btn secondary" href="${link(c)}"><strong lang="zh">${esc(c)}</strong><span>${esc(row.pinyin.join(' / '))}</span><small>${esc(catalog.compareMeaning[c]||row.gloss_id)}</small></a>`:'';}).join('')}</div></article>`};
    },12);
    mode.onchange=q.oninput=refresh;
    return;
  }
  async function action(button,run){
    if(busy||disposed)return;
    busy=true;button.disabled=true;$('#atlas-error').textContent='';
    try{await run();}catch(error){if(!disposed)$('#atlas-error').textContent=error.message;}
    finally{busy=false;if(!disposed)button.disabled=false;}
  }
  function open(button,pack,restart=false){
    return action(button,async()=>{
      const next=await api('/atlas/attempts',{method:'POST',body:{package:pack,restart}});
      if(!disposed)location.hash='pinyin/'+next.id;
    });
  }
  if(route==='pinyin-mistakes'){
    const entries=Object.entries(progress.mistakes).filter(([c])=>byHanzi.has(c)).sort((a,b)=>Number(b[1].active)-Number(a[1].active)||b[1].wrong_at-a[1].wrong_at);
    const active=entries.filter(([,m])=>m.active).length;
    host.innerHTML=`<p>${active} perlu diulang · ${entries.length} dalam riwayat</p><button class="btn mb" id="atlas-review" ${active?'':'disabled'}>Review kesalahan aktif</button>${list}`;
    $('#atlas-review').onclick=e=>open(e.currentTarget,null);
    paged(()=>({items:entries,card:([c,m])=>`<article class="panel"><a class="hanzi" lang="zh" href="${link(c)}">${esc(c)}</a><p>${esc(byHanzi.get(c).pinyin.join(' / '))} · ${esc(byHanzi.get(c).gloss_id)}</p><strong>${m.active?'Perlu diulang':'Sudah diperbaiki'}</strong><p>Salah ${m.count} kali · Terakhir memilih ${esc(m.answer)}</p></article>`}),24);
    return;
  }
  if(!attempt){
    host.innerHTML=`<p>30 paket tetap, masing-masing 100 hanzi. Urutan soal dan pilihan diacak saat memulai percobaan.</p><div class="atlas-grid">${Array.from({length:30},(_,i)=>`<article class="panel"><h2>Paket ${String(i+1).padStart(2,'0')}</h2><p>100 hanzi · Skor terbaik ${progress.best[i+1]??'—'}</p><button class="btn" data-pack="${i+1}">Mulai / lanjutkan →</button></article>`).join('')}</div>`;
    for(const button of host.querySelectorAll('[data-pack]'))button.onclick=()=>open(button,Number(button.dataset.pack));
    return;
  }
  function exercise(run,showLast=false){
    const question=run.question,last=run.last,word=last&&byHanzi.get(last.hanzi);
    const label=run.package?'Paket '+String(run.package).padStart(2,'0'):'Review kesalahan';
    const complete=!question;
    host.innerHTML=`<section class="panel"><h2>${label}</h2><p>${run.answered}/${run.total} terjawab · Benar ${run.score}</p><progress value="${run.answered}" max="${run.total}" aria-label="Progres soal"></progress>
      ${showLast&&word?`<div class="recall-feedback ${last.correct?'correct':'wrong'}" role="status"><strong>${last.correct?'Benar':'Belum tepat'} · ${esc(word.hanzi)} · ${esc(word.pinyin.join(' / '))}</strong><p>${esc(word.gloss_id)}</p>${examples(word)}</div>`:''}
      ${complete?`<h3 class="mt">Selesai · Skor ${run.score}/${run.total} · +${run.xp} XP</h3><div class="split"><a class="btn secondary" href="#pinyin-mistakes">Lihat Gudang Kesalahan</a>${run.package?'<button class="btn" id="atlas-repeat">Ulangi paket</button>':''}</div>`:
        showLast?'<button class="btn mt" id="atlas-next-question">Soal berikutnya →</button>':`<p class="hanzi" lang="zh">${esc(question.hanzi)}</p><div class="atlas-answers">${question.options.map((option,i)=>`<button class="btn secondary" data-choice="${i}">${esc(option)}</button>`).join('')}</div>`}
    </section>`;
    for(const button of host.querySelectorAll('[data-choice]'))button.onclick=()=>action(button,async()=>{
      const next=await api('/atlas/attempts/'+run.id,{method:'PUT',body:{index:run.answered,choice:question.options[Number(button.dataset.choice)]}});
      if(!disposed){exercise(next,true);($('#atlas-next-question')||$('#atlas-repeat')||host.querySelector('a'))?.focus();}
    });
    const next=$('#atlas-next-question');
    if(next)next.onclick=()=>{exercise(run);host.querySelector('[data-choice]')?.focus();};
    const repeat=$('#atlas-repeat');
    if(repeat)repeat.onclick=()=>open(repeat,run.package,true);
  }
  exercise(attempt,!!attempt.last);
}
