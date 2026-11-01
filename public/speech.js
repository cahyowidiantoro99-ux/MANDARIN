let current=null,currentButton=null,startTimer=null;
const engine=()=>globalThis.speechSynthesis;
const voices=()=>engine()?.getVoices().filter(v=>/^(zh|cmn)(-|_|$)/i.test(v.lang)&&!/^zh[-_]HK/i.test(v.lang))||[];
export const speechAvailable=()=>!!(globalThis.SpeechSynthesisUtterance&&voices().length);
export function stopSpeech(){clearTimeout(startTimer);current=null;currentButton=null;engine()?.cancel();document.querySelectorAll('[data-speak]').forEach(b=>b.setAttribute('aria-pressed','false'));}
export function speechSettings(){return '';}
export function speakMandarin(text,{rate=1,start=()=>{},end=()=>{},error=()=>{}}={}){
 const list=voices(),voice=list.find(v=>/Kangkang/i.test(v.name))||list.find(v=>v.localService&&/^zh[-_]CN$/i.test(v.lang))||list.find(v=>/^zh[-_]CN$/i.test(v.lang))||list[0];
 if(!voice||!globalThis.SpeechSynthesisUtterance){error();return false;}
 const u=new SpeechSynthesisUtterance(text);u.voice=voice;u.lang=voice.lang;u.rate=.72*rate;u.pitch=.88;current=u;
 const fail=()=>{if(current!==u)return;stopSpeech();error();};
 u.onstart=()=>{if(current!==u)return;clearTimeout(startTimer);start();};u.onend=()=>{if(current!==u)return;stopSpeech();end();};u.onerror=fail;
 // A failed device voice must not leave a queued or loading button indefinitely.
 startTimer=setTimeout(fail,1500);try{engine().speak(u);}catch{fail();return false;}return true;
}
export function wireSpeech(root){
 const sync=()=>root.querySelectorAll('[data-speak],[data-audio],[data-line],#lp-narrate,#lp-stop').forEach(b=>{b.hidden=!speechAvailable();});sync();
 const synth=engine();synth?.addEventListener?.('voiceschanged',sync);const observer=new MutationObserver(sync);observer.observe(root,{childList:true,subtree:true});
 const click=e=>{const button=e.target.closest('[data-speak]');if(!button||!root.contains(button))return;const wasCurrent=button===currentButton;stopSpeech();if(wasCurrent)return;
 const ok=speakMandarin(decodeURIComponent(button.dataset.speak),{start:()=>button.setAttribute('aria-pressed','true'),error:()=>{button.hidden=true;}});if(ok)currentButton=button;};
 root.addEventListener('click',click);return()=>{stopSpeech();observer.disconnect();synth?.removeEventListener?.('voiceschanged',sync);root.removeEventListener('click',click);};
}
