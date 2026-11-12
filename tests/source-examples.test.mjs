import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync}from'node:fs';
const data=JSON.parse(readFileSync(new URL('../data/official-hsk/structured/content.json',import.meta.url),'utf8'));
test('Reported HSK2 examples and cloze preserve original text and source pinyin',()=>{
 for(const code of ['H21005','H21112']){const c=data[code].items[36];assert(c.example_figures.length);assert(c.source_examples.some(e=>e.lines.some(l=>l.text.includes('篮球'))));assert(c.pinyin);}
 const c=data.H21005.items[44];assert(!c.prompt.includes('？？'));assert(c.prompt.includes('____'));assert(c.source_examples.some(e=>e.lines.some(l=>l.text.includes('羊肉'))));assert.equal(c.options.find(o=>o.text==='认识').pinyin,'rènshi');
 assert.equal(data.H21112.items[53].context,null);
});
test('Native writing rules never expose the hidden article as a permanent prompt',()=>{
 for(const [code,p]of Object.entries(data)){if(!code.startsWith('H6'))continue;const c=p.items[101];assert(c.prompt.includes('400'));assert(c.prompt.includes('答题卡'));assert(c.prompt.length<500);assert(!/Tulis|Pilih|Dengarkan/.test(c.prompt));}
});
