import test from 'node:test';
import assert from 'node:assert/strict';
import {callWritingProvider,writingProviderReady} from '../app/writing-provider.mjs';
test('Gemini uses private header, structured vision input, and never falls back on quota errors',async()=>{
 const names=['AI_GRADING_PROVIDER','GEMINI_API_KEY','GEMINI_GRADING_MODEL'];const saved=names.map(n=>process.env[n]);
 Object.assign(process.env,{AI_GRADING_PROVIDER:'gemini',GEMINI_API_KEY:'test-secret',GEMINI_GRADING_MODEL:'gemini-test'});
 try{
  assert(writingProviderReady());let calls=0;const request={input:[{type:'input_text',text:'测试'},{type:'input_image',image_url:'data:image/jpeg;base64,aGVsbG8='}],schema:{type:'object'},instructions:'Assess writing'};
  const result=await callWritingProvider({...request,fetcher:async(url,options)=>{calls++;assert(!url.includes('test-secret'));assert.equal(options.headers['x-goog-api-key'],'test-secret');const b=JSON.parse(options.body);assert.equal(b.contents[0].parts[1].inlineData.data,'aGVsbG8=');assert.equal(b.generationConfig.responseMimeType,'application/json');return {ok:true,json:async()=>({candidates:[{finishReason:'STOP',content:{parts:[{text:'{"grades":[]}'}]}}]})};}});
  assert.deepEqual(result.parsed,{grades:[]});assert.equal(result.provider,'gemini');assert.equal(calls,1);
  await assert.rejects(()=>callWritingProvider({...request,fetcher:async()=>{calls++;return {status:429,ok:false};}}),/Kuota Gemini gratis/);assert.equal(calls,2);
  await assert.rejects(()=>callWritingProvider({...request,fetcher:async()=>({ok:true,json:async()=>({candidates:[{finishReason:'MAX_TOKENS'}]})})}),/belum lengkap/);
 }finally{names.forEach((n,i)=>saved[i]===undefined?delete process.env[n]:process.env[n]=saved[i]);}
});
