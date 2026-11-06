export function mountDashboardPlan({api,root,esc,date,fmtTime,historyHTML,cleanup}){
  let disposed=false,timer=null,loaded=false;
  cleanup(()=>{disposed=true;clearInterval(timer);});
  const $=selector=>root.querySelector(selector);
  const panel=$('#dashboard-plan'), errors=$('#dashboard-plan-error');
  const activityNames={atlas_pinyin:'Latihan Pinyin',review:'Review kosakata',recall:'Recall kosakata',grammar:'Tata bahasa',matching:'Mencocokkan kata',sentence:'Susun kalimat',listening:'Menyimak',story:'Cerita',contrast:'Perbedaan kosakata'};
  async function target(){
    if(loaded)return;
    loaded=true;
    try{
      const payload=await api('/learning-target');
      if(!disposed)draw(payload);
    }catch(error){
      if(!disposed){errors.textContent=error.message;loaded=false;}
    }
  }
  function draw(payload,editing=false,base=performance.now()){
    const {target:current,options,server_now}=payload;
    clearInterval(timer);
    if(current){
      const node=$('#dashboard-countdown');
      node.hidden=false;
      const update=()=>{
        const seconds=Math.max(0,Math.ceil(Number(current.deadline)-Number(server_now)-(performance.now()-base)/1000));
        const parts=[Math.floor(seconds/86400),Math.floor(seconds%86400/3600),Math.floor(seconds%3600/60),seconds%60];
        node.textContent=seconds?`Target Level ${current.level} · ${parts[0]} hari ${parts[1]} jam ${parts[2]} menit ${parts[3]} detik`:`Tanggal target Level ${current.level} sudah lewat. Perbarui tanggal jika ingin lanjut.`;
      };
      update();timer=setInterval(update,1000);
    }
    const guidance=plan=>`<p><strong>${esc(plan.reference)}</strong></p><p class="muted">Saran latihan</p>
      <ul class="dashboard-checklist">${plan.tasks.map(task=>`<li><span>${esc(task.label)}</span>${task.href?`<a href="${esc(task.href)}">Buka latihan →</a>`:''}</li>`).join('')}</ul>`;
    if(current&&!editing){
      const formatted=new Intl.DateTimeFormat('id-ID',{dateStyle:'long',timeZone:'UTC'}).format(new Date(current.date+'T00:00:00Z'));
      panel.innerHTML=`<p><strong>Level Perusahaan ${current.level}</strong> · ${esc(formatted)} (WITA)</p>
        <button class="btn secondary" id="dashboard-target-edit" type="button">Edit target</button>
        <div class="mt">${guidance(current)}</div>`;
      $('#dashboard-target-edit').onclick=()=>{errors.textContent='';draw(payload,true,base);$('#dashboard-target-form select').focus();};
      return;
    }
    const today=new Date((Number(server_now)+28800)*1000).toISOString().slice(0,10);
    const initialLevel=current?.level||1;
    panel.innerHTML=`<form id="dashboard-target-form">
      <div class="filters"><label>Target lulus Level Perusahaan<select name="level">${options.map(p=>`<option value="${p.level}" ${p.level===initialLevel?'selected':''}>Level ${p.level}</option>`).join('')}</select></label>
      <label>Tanggal target (WITA)<input name="date" type="date" min="${today}" value="${esc(current?.date||'')}" required></label></div>
      <div id="dashboard-target-tasks"></div><button class="btn mt" type="submit">Simpan target</button>${current?` <button class="btn secondary mt" id="dashboard-target-cancel" type="button">Batal</button>`:''}
    </form><p class="muted mt">Panduan ini untuk persiapan belajar pribadi. Level Perusahaan 1–8 mengikuti TSZ15025, dengan penilaian perusahaan yang terpisah dan berurutan.</p>`;
    const form=$('#dashboard-target-form'), checklist=$('#dashboard-target-tasks');

    function showPlan(){
      const plan=options.find(p=>p.level===Number(form.elements.level.value));
      checklist.innerHTML=guidance(plan);
    }
    form.elements.level.onchange=showPlan;
    showPlan();
    if(current)$('#dashboard-target-cancel').onclick=()=>{errors.textContent='';draw(payload,false,base);$('#dashboard-target-edit').focus();};
    form.onsubmit=async event=>{
      event.preventDefault();
      const button=form.querySelector('button[type=submit]');
      button.disabled=true;errors.textContent='';
      try{
        const response=await api('/learning-target',{method:'PUT',body:{level:Number(form.elements.level.value),date:form.elements.date.value}});
        if(!disposed){draw({...response,options});errors.textContent='Target belajar tersimpan.';}
      }catch(error){if(!disposed){errors.textContent=error.message;button.disabled=false;}}
    };
  }
  target();
  const histories=[...root.querySelectorAll('[data-dashboard-history]')];
  for(const details of histories){
    const kind=details.dataset.dashboardHistory, list=details.querySelector('.dashboard-history-list');
    let offset=0, started=false, busy=false;
    const more=details.querySelector('button');
    async function fetchPage(){
      if(busy||disposed)return;
      busy=true;more.disabled=true;
      try{
        const {rows,more:hasMore}=await api('/dashboard/history/'+kind+'?offset='+offset);
        if(disposed)return;
        const dateAt=value=>esc(date(Number(value),true));
        const name=value=>esc(activityNames[value]||value);
        const html=kind==='exams'?historyHTML(rows):rows.map(row=>kind==='xp'?
          `<p>${dateAt(row.created_at)} · ${name(row.activity)} · <strong>+${Number(row.amount)} XP</strong></p>`:kind==='learning'?
          `<p>${dateAt(row.started_at)} · ${esc(row.title)} · ${fmtTime(Number(row.active_seconds))}</p>`:
          `<p>${dateAt(row.created_at)} · ${name(row.kind)} · Skor ${Number(row.score)}%</p>`).join('');
        if(offset===0)list.innerHTML=html||'<p>Belum ada catatan.</p>';
        else list.insertAdjacentHTML('beforeend',html);
        offset+=rows.length;started=true;more.hidden=!hasMore;more.textContent='Muat lebih banyak';
      }catch(error){
        if(!disposed){if(offset===0)list.textContent=error.message;else errors.textContent=error.message;more.textContent='Coba lagi';more.hidden=false;}
      }finally{busy=false;if(!disposed)more.disabled=false;}
    }
    details.ontoggle=()=>{if(details.open&&!started)void fetchPage();};
    more.onclick=()=>void fetchPage();
  }
}
