export function mountStructuredQuestions(host,{items,answers,sessionId,esc,onAnswer}){
 let index=0;
 const image=id=>'/api/official-exams/'+sessionId+'/figure/'+id;
 const optionBody=option=>option.image?'<img src="'+image(option.image)+'" alt="Pilihan '+esc(option.value)+'" decoding="async">':'<span lang="zh">'+esc(option.text)+'</span>';
 function draw(){
  const item=items[index],content=item.content;
  host.innerHTML='<section class="structured-question"><div class="structured-meta"><strong>Soal '+item.number+'</strong><span>'+ (index+1)+' / '+items.length+'</span></div>'+
   (content.group?'<nav class="structured-group" aria-label="Soal dalam kelompok"><span>'+esc(content.group.label)+'</span>'+items.filter(other=>other.content.group?.id===content.group.id).map(other=>'<button type="button" data-jump="'+items.indexOf(other)+'" aria-current="'+(other===item?'step':'false')+'">'+other.number+(answers[other.number]?' ✓':'')+'</button>').join('')+'</nav>':'')+
   (content.context?'<div class="structured-context" lang="zh" tabindex="0" aria-label="Bacaan bersama">'+esc(content.context).replace(/\n/g,'<br>')+'</div>':'')+
   '<div class="structured-prompt" data-learning-content>'+esc(content.prompt).replace(/\n/g,'<br>')+'</div>'+
   (content.pinyin?'<p class="pinyin" data-learning-content>'+esc(content.pinyin)+'</p>':'')+
   content.figures.map(id=>'<img class="structured-figure" src="'+image(id)+'" alt="Gambar soal '+item.number+'" decoding="async">').join('')+
   (item.kind==='writing'?'<label class="field">Jawaban Anda<textarea data-written rows="4" maxlength="6000" lang="zh">'+esc(answers[item.number]||'')+'</textarea></label>':'<div class="structured-options '+(content.options.some(o=>o.image)?'with-images':'')+'" role="group" aria-label="Pilihan jawaban">'+(content.options.length?content.options:item.choices.map(value=>({value,text:value==='√'?'Benar ✓':value==='×'?'Salah ✕':value}))).map(option=>'<button type="button" class="structured-option" data-choice="'+esc(option.value)+'" aria-pressed="'+(answers[item.number]===option.value)+'">'+optionBody(option)+'</button>').join('')+'</div>')+
   '<footer class="structured-navigation"><button class="btn secondary" type="button" data-previous '+(!index?'disabled':'')+'>← Sebelumnya</button><span>'+Object.keys(answers).filter(n=>items.some(i=>String(i.number)===n)&&answers[n]).length+' / '+items.length+' terisi</span><button class="btn" type="button" data-next '+(index===items.length-1?'disabled':'')+'>Selanjutnya →</button></footer></section>';
  host.querySelectorAll('[data-choice]').forEach(button=>button.onclick=()=>{
   answers[item.number]=button.dataset.choice;
   onAnswer(item.number,button.dataset.choice);
   host.querySelectorAll('[data-choice]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
   const counter=host.querySelector('.structured-navigation span');
   counter.textContent=items.filter(i=>answers[i.number]).length+' / '+items.length+' terisi';
  });
  const written=host.querySelector('[data-written]');
  if(written)written.oninput=()=>{answers[item.number]=written.value;onAnswer(item.number,written.value);};
  const move=next=>{index=next;draw();host.scrollIntoView({block:'start'});};
  host.querySelector('[data-previous]').onclick=()=>move(index-1);
  host.querySelector('[data-next]').onclick=()=>move(index+1);
  host.querySelectorAll('[data-jump]').forEach(button=>button.onclick=()=>move(Number(button.dataset.jump)));
 }
 draw();
}
