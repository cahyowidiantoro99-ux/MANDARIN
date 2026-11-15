const keys=['period','department','division','job_title','q','level','at'];
let owner=null,saved={};
export function leaderFilters(user,incoming={}){if(owner!==user?.id){owner=user?.id;saved={};try{const value=JSON.parse(sessionStorage.getItem('ecb-leader-filters')||'null');if(value?.owner===owner)saved=value.filters||{};}catch{}}return {...saved,...incoming};}
export function rememberLeaderFilters(filters){saved=Object.fromEntries(keys.filter(k=>filters[k]).map(k=>[k,filters[k]]));try{sessionStorage.setItem('ecb-leader-filters',JSON.stringify({owner,filters:saved}));}catch{}}
export function autoLeaderFilters(form){let timer;const submit=()=>{clearTimeout(timer);if(form.isConnected)form.requestSubmit();};form.addEventListener('change',e=>{if(e.target.matches('select,input[type=date]'))submit();});form.addEventListener('input',e=>{if(e.target.matches('input:not([type=date])')){clearTimeout(timer);timer=setTimeout(submit,450);}});return ()=>clearTimeout(timer);}
