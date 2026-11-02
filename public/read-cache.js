// Short lived, in-memory and account scoped. Never caches exam sessions or mutations.
export const cacheableRead=path=>/^\/(dashboard|packages|learn\/summary|play\/catalog)(\?.*)?$/.test(path);
export function createReadCache({clock=()=>Date.now(),ttl=10000}={}){
 const values=new Map(),pending=new Map();let generation=0;
 return {invalidate(){generation++;values.clear();pending.clear();},async read(scope,path,load){
  if(!scope||!cacheableRead(path))return load();const key=scope+':'+path,g=generation,hit=values.get(key);
  if(hit&&hit.expires>clock())return structuredClone(hit.data);
  if(!pending.has(key)){const promise=Promise.resolve().then(load).then(data=>{if(g===generation)values.set(key,{data:structuredClone(data),expires:clock()+ttl});return data;}).finally(()=>{if(pending.get(key)===promise)pending.delete(key);});pending.set(key,promise);}
  return structuredClone(await pending.get(key));
 }};
}
