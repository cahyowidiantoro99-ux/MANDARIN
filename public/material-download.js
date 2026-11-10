export function materialDownload(kind){
 return `<details class="material-download"><summary>Unduh PDF materi ↓</summary><div><p>Landscape · Hanzi, pinyin, arti Indonesia, dan contoh dari Atlas.</p><label>Pilih level HSK<select data-pdf-level>${['1','2','3','4','5','6','7-9'].map(l=>`<option value="${l}">HSK ${l}</option>`).join('')}</select></label><a class="btn" data-pdf-kind="${kind}" href="/api/material-pdf/${kind}/1" download>Unduh HSK 1 ↓</a><small>HSK 7–9 satu kelompok. File dimuat hanya saat diunduh.</small></div></details>`;
}
export function wireMaterialDownload(root){
 const select=root.querySelector('[data-pdf-level]'),link=root.querySelector('[data-pdf-kind]');if(!select||!link)return;
 select.onchange=()=>{link.href='/api/material-pdf/'+link.dataset.pdfKind+'/'+select.value;link.textContent='Unduh HSK '+select.value+' ↓';};
}
