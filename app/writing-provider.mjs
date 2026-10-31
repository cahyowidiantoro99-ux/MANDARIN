import {assert} from './domain.mjs';
export function writingProvider(){const provider=process.env.AI_GRADING_PROVIDER||'openai';if(provider==='gemini')return {provider,model:process.env.GEMINI_GRADING_MODEL||'',key:process.env.GEMINI_API_KEY||''};if(provider==='openai')return {provider,model:process.env.OPENAI_GRADING_MODEL||'',key:process.env.OPENAI_API_KEY||''};return {provider,model:'',key:''};}
export const writingProviderReady=()=>{const c=writingProvider();return Boolean(c.model&&c.key);};
export async function callWritingProvider({input,schema,instructions,fetcher=fetch}){
 const config=writingProvider();assert(config.key&&config.model,503,'Penilaian AI belum dikonfigurasi. Jawaban tetap tersimpan.');assert(/^[a-zA-Z0-9._-]+$/.test(config.model),503,'Model penilaian belum valid.');let url,headers,body;
 if(config.provider==='gemini'){
  url=`https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent`;headers={'Content-Type':'application/json','x-goog-api-key':config.key};body={systemInstruction:{parts:[{text:instructions}]},contents:[{role:'user',parts:input.map(part=>part.type==='input_text'?{text:part.text}:{inlineData:{mimeType:'image/jpeg',data:part.image_url.split(',')[1]}})}],generationConfig:{maxOutputTokens:4096,responseMimeType:'application/json',responseJsonSchema:schema,thinkingConfig:{thinkingLevel:'LOW'}}};
 }else{
  url='https://api.openai.com/v1/responses';headers={'Content-Type':'application/json',Authorization:'Bearer '+config.key};body={model:config.model,max_output_tokens:4096,...(process.env.OPENAI_GRADING_REASONING?{reasoning:{effort:process.env.OPENAI_GRADING_REASONING}}:{}),store:false,instructions,input:[{role:'user',content:input}],text:{format:{type:'json_schema',name:'hsk_writing_grades',strict:true,schema}}};
 }
 const response=await fetcher(url,{method:'POST',signal:AbortSignal.timeout(60000),headers,body:JSON.stringify(body)});
 assert(response.status!==429,429,config.provider==='gemini'?'Kuota Gemini gratis sementara habis. Jawaban tersimpan; coba lagi nanti.':'Kuota API sementara habis. Jawaban tetap tersimpan.');assert(response.ok,503,'Layanan AI belum dapat menilai. Jawaban tetap tersimpan.');const payload=await response.json();let text;
 if(config.provider==='gemini'){const candidate=payload.candidates?.[0];assert(candidate?.finishReason==='STOP',503,'Penilaian AI belum lengkap. Jawaban tetap tersimpan.');text=candidate.content?.parts?.filter(p=>p.text&&!p.thought).map(p=>p.text).join('');}
 else text=payload.output?.flatMap(o=>o.content||[]).filter(c=>c.type==='output_text').map(c=>c.text).join('')||payload.output_text;
 assert(typeof text==='string'&&text.length>0,503,'Penilaian AI belum lengkap. Jawaban tetap tersimpan.');return {parsed:JSON.parse(text),provider:config.provider,model:config.model};
}
