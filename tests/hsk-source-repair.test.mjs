import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {archivePapers} from '../app/hsk-bank.mjs';
const data=JSON.parse(readFileSync(new URL('../data/official-hsk/structured/content.json',import.meta.url)));
test('Every item has a meaningful stem and cloze groups expose their numbered blank',()=>{
 let count=0;
 for(const p of archivePapers)for(const item of p.items){
  count++;const c=data[p.id].items[item.number];
  assert(!/^[A-F\s.．、]+$/.test(c.prompt),p.id+' '+item.number+' orphan label');
  assert(!/\b(?:Pilih|Dengarkan|Tulis|Tuliskan|Susun|Bacalah)\b/.test([c.prompt,c.instruction,c.context].filter(Boolean).join(' ')),p.id+' '+item.number+' source-only language');
  if(c.instruction)assert(/\p{Script=Han}/u.test(c.instruction),p.id+' source section heading');
  if(p.level===6&&item.number>=61&&item.number<=70){
   assert(c.blank_count>=2,p.id+' '+item.number+' blanks');
   for(let i=1;i<=c.blank_count;i++)assert(c.prompt.includes('【'+i+'】____'));
  }
  if((p.level===5&&item.number>=46&&item.number<=60)||(p.level===6&&item.number>=71&&item.number<=80))assert(c.context.includes('【'+item.number+'】____'),p.id+' '+item.number+' numbered blank');
  if(p.level===3&&item.number>=76&&item.number<=80)assert(c.pinyin||/[（(][a-zāáǎàēéěèīíǐìōóǒòūúǔùüǖǘǚǜ]+[）)]/i.test(c.prompt),p.id+' '+item.number+' writing pinyin');
 }
 assert.equal(count,10281);
});
test('Reported H61009 and H31002 defects stay repaired',()=>{
 assert.equal(data.H61009.items[62].blank_count,3);
 assert.match(data.H61009.items[62].prompt,/在【1】____不同/);
 for(const n of [1,35])assert.equal(data.H31002.items[n].prompt,'');
 assert.match(data.H31001.items[76].pinyin,/chū/);
});

test('All HSK1–4 word-cloze stems retain visible answer spaces; HSK6 tuple length agrees',()=>{
 for(const p of archivePapers)for(const item of p.items){const n=item.number,c=data[p.id].items[n];
  if((p.level===1&&n>=36)||(p.level===2&&n>=41&&n<=45)||(p.level===3&&n>=51&&n<=60)||(p.level===4&&n>=46&&n<=55))assert(c.prompt.includes('____'),p.id+' '+n);
  if(p.level===6&&n>=61&&n<=70)for(const o of c.options)assert.equal(o.text.trim().split(/[\s　]+/).length,c.blank_count,p.id+' '+n+' '+o.value);
 }
 assert.match(data.H41003.items[52].prompt,/^A：/);
 assert(!data.H41003.items[52].context);
 assert.equal(data.H61333.items[84].options.find(o=>o.value==='B').text,'做事要循序渐进');
});

test('Verified picture pools preserve source A/B mapping rather than visual sort order',()=>{
 for(const [code,n,a,b] of [['H10902',26,39,40],['H11005',26,39,40],['H11330',11,26,29]]){
  for(let number=n;number<n+5;number++){
   assert.equal(data[code].items[number].options.find(o=>o.value==='A').image,a);
   assert.equal(data[code].items[number].options.find(o=>o.value==='B').image,b);
  }
 }
});

test('Writing reference alternatives include the continuation line from source',()=>{
 for(const [code,end] of [['H41001','排列。'],['H41002','京举行。'],['H51001','身房锻炼。']])assert(archivePapers.find(p=>p.id===code).items.find(i=>i.number===91).reference.endsWith(end));
});
