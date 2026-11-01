import {pinyin} from 'pinyin-pro';
const cache=new Map();
export function readingSegments(value){
 const text=String(value??'');if(!/\p{Script=Han}/u.test(text))return null;
 if(cache.has(text))return cache.get(text);
 const parts=text.split(/(\p{Script=Han}+)/u).filter(Boolean).map(text=>({text,pinyin:/^\p{Script=Han}+$/u.test(text)?pinyin(text,{toneType:'symbol',type:'string'}):null}));
 if(cache.size>=10000)cache.clear();cache.set(text,parts);return parts;
}
export function addQuestionReading(question){const testsReading=question.kind==='pinyin'||/\bpinyin\b|拼音|读音|pelafalan|pronunciation/i.test(question.prompt);return {...question,prompt_reading:testsReading?null:readingSegments(question.prompt),options:question.options.map(option=>({...option,reading:testsReading?null:readingSegments(option.label)}))};}
