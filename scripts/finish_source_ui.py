from pathlib import Path
p=Path(__file__).resolve().parents[1]/'public/app.js';s=p.read_text(encoding='utf8')
old="wireStarts();}\nasync function examPage"
new="""wireStarts();if(meta.source_content){const status=await api('/content-status');if(!status.department_ready){document.querySelectorAll('[data-track=work]').forEach(b=>{b.disabled=true;b.title='Materi departemen belum dapat dibaca';});document.querySelector('.content').insertAdjacentHTML('afterbegin','<div class="notice error">Assessment Work departemen '+esc(user.department)+' belum tersedia karena sumber departemen belum dapat dibaca. Materi umum tetap tersedia di Learning dan Perpustakaan Sumber.</div>');}}}
async function examPage"""
if old in s:s=s.replace(old,new)
s=s.replace("${r.row?' · baris '+esc(r.row):''}","${r.row?' · baris '+esc(r.row):''}${r.column?' · kolom '+esc(r.column):''}")
p.write_text(s,encoding='utf8');print('Source availability and column provenance integrated.')
