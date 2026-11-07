export const speakerIcon='<span class="speaker-symbol" aria-hidden="true"><svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 9h4l5-4v14l-5-4H3zM16 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/></svg></span>';
let current=null,currentButton=null,startTimer=null;
const engine=()=>globalThis.speechSynthesis;
const voices=()=>engine()?.getVoices().filter(v=>/^(zh|cmn)(-|_|$)/i.test(v.lang)&&!/^zh[-_]HK/i.test(v.lang))||[];
export const speechAvailable=()=>!!(globalThis.SpeechSynthesisUtterance&&voices().length);
export function stopSpeech(){clearTimeout(startTimer);const synth=engine(),wasActive=!!current||synth?.speaking||synth?.pending;current=null;currentButton=null;if(wasActive)synth?.cancel();document.querySelectorAll('[data-speak]').forEach(b=>b.setAttribute('aria-pressed','false'));document.querySelectorAll('.speech-feedback').forEach(n=>n.textContent='');}
export function speechSettings(){return '';}
export function speakMandarin(text,{rate=1,start=()=>{},end=()=>{},error=()=>{}}={}){
 const list=voices(),voice=list.find(v=>/Kangkang/i.test(v.name))||list.find(v=>v.localService&&/^zh[-_]CN$/i.test(v.lang))||list.find(v=>/^zh[-_]CN$/i.test(v.lang))||list[0];
 if(!voice||!globalThis.SpeechSynthesisUtterance||!String(text||'').trim()){error();return false;}
 if(current||engine().speaking||engine().pending)stopSpeech();
 const u=new SpeechSynthesisUtterance(text);u.voice=voice;u.lang=voice.lang;u.rate=.72*rate;u.pitch=.88;current=u;
 const fail=()=>{if(current!==u)return;stopSpeech();error();};
 u.onstart=()=>{if(current!==u)return;clearTimeout(startTimer);start();};u.onend=()=>{if(current!==u)return;stopSpeech();end();};u.onerror=fail;
 // Bound startup time; do not cancel an idle Android engine immediately before speak.
 startTimer=setTimeout(fail,2500);try{if(engine().paused)engine().resume?.();engine().speak(u);}catch{fail();return false;}return true;
}
export function wireSpeech(root){
 const selector='[data-speak],[data-audio],[data-line],#lp-narrate,#lp-stop';
 const sync=(scope=root)=>{const available=speechAvailable();if(scope.matches?.(selector))scope.hidden=!available;scope.querySelectorAll?.(selector).forEach(b=>{b.hidden=!available;});};sync();
 const voiceChange=()=>sync(),visibility=()=>{if(document.visibilityState==='hidden')stopSpeech();};
 const synth=engine();synth?.addEventListener?.('voiceschanged',voiceChange);document.addEventListener('visibilitychange',visibility);
 // Flashcard flips and feedback change many text nodes; inspect only added controls.
 const observer=new MutationObserver(records=>{for(const record of records)for(const node of record.addedNodes)if(node.nodeType===1)sync(node);});observer.observe(root,{childList:true,subtree:true});
 const click=e=>{const button=e.target.closest('[data-speak]');if(!button||!root.contains(button))return;const wasCurrent=button===currentButton;stopSpeech();if(wasCurrent)return;
 root.querySelectorAll('.speech-feedback').forEach(n=>n.remove());const message=document.createElement('small');message.className='speech-feedback';message.setAttribute('role','status');button.insertAdjacentElement('afterend',message);message.textContent='Memulai audio…';const ok=speakMandarin(decodeURIComponent(button.dataset.speak),{start:()=>{button.setAttribute('aria-pressed','true');message.textContent='Audio sedang diputar…';},end:()=>{message.textContent='';},error:()=>{button.setAttribute('aria-pressed','false');message.textContent='Suara perangkat belum dapat diputar. Periksa volume media atau coba kembali.';}});if(ok)currentButton=button;};
 root.addEventListener('click',click);return()=>{stopSpeech();observer.disconnect();synth?.removeEventListener?.('voiceschanged',voiceChange);document.removeEventListener('visibilitychange',visibility);root.removeEventListener('click',click);};
}
