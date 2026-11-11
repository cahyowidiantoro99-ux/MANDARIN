export function confirmSubmit(root){
 return new Promise(resolve=>{
 const previous=document.activeElement,dialog=document.createElement('dialog');dialog.className='exam-confirm';dialog.setAttribute('aria-labelledby','exam-confirm-title');dialog.innerHTML='<h2 id="exam-confirm-title">Yakin kirim jawaban?</h2><p>Periksa jawaban Anda sebelum menyelesaikan ujian.</p><div class="split"><button class="btn secondary" data-cancel>Tidak, periksa lagi</button><button class="btn danger" data-confirm>Ya, kirim jawaban</button></div>';root.append(dialog);
 const finish=value=>{dialog.close();dialog.remove();previous?.focus();resolve(value);};dialog.querySelector('[data-cancel]').onclick=()=>finish(false);dialog.querySelector('[data-confirm]').onclick=()=>finish(true);dialog.oncancel=event=>{event.preventDefault();finish(false);};dialog.showModal();dialog.querySelector('[data-cancel]').focus();
 });
}
