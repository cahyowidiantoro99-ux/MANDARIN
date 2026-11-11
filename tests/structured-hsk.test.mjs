import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {structuredItems,structuredFigure} from '../app/official-content.mjs';
import {archivePapers as bank} from '../app/hsk-bank.mjs';
test('Structured HSK source covers every item and preserves source answer identity without keys in content',()=>{
 assert.equal(bank.length,121);
 for(const p of bank){
  const code=p.id,total=p.total,items=structuredItems(p,p.items);
  assert(items.every(i=>i.content),code+' coverage');
  assert.equal(items.length,total);
  assert.equal(new Set(items.map(i=>i.number)).size,total);
  for(const item of items){
   assert(item.content.prompt.trim(),code+' '+item.number);
   if(item.kind==='judgment'&&(p.level===1||(p.level===2&&item.number<=10)))assert(item.content.figures.length,code+' '+item.number+' picture');
   if(item.kind==='ordering')assert(/[ABC]/.test(item.content.prompt),code+' '+item.number+' ordering');
   if(item.content.group)assert(items.filter(i=>i.content.group?.id===item.content.group.id).length<=6,code+' bounded group');
   assert(!JSON.stringify(item.content).includes('"key"'));
   assert(!JSON.stringify(item.content).includes('"reference"'));
   if(item.key)assert(item.choices.includes(item.key));
   for(const image of [...item.content.figures,...item.content.options.filter(o=>o.image).map(o=>o.image)]){
    assert(existsSync(new URL('../data/official-hsk/structured/'+code+'-'+image+'.webp',import.meta.url)));
    assert(structuredFigure(p,[item],image));
   }
  }
  assert.equal(structuredFigure(p,[],1),false);
  assert.equal(structuredFigure(p,items,99999),false);
  assert.equal(structuredItems({...p,sha256:'changed'},p.items),p.items);
 }
 const h3=bank.find(p=>p.id==='H31002');
 assert.equal(structuredItems(h3,h3.items).find(i=>i.number===46).choices.length,5);
});
