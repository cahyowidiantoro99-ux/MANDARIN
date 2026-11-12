import {readFileSync} from 'node:fs';
const sources=JSON.parse(readFileSync(new URL('../data/official-hsk/structured/content.json',import.meta.url),'utf8'));
export function structuredItems(paper,items){
 const source=sources[paper.id];
 if(!source||source.source_sha256!==paper.sha256)return items;
 return items.map(item=>{
  const content=source.items[item.number];
  return content?{...item,content,choices:content.options.length?content.options.map(option=>option.value):item.choices}:item;
 });
}
export function structuredFigure(paper,items,figure){
 if(!Number.isInteger(figure))return false;
 return structuredItems(paper,items).some(item=>item.content&&([...item.content.figures,...(item.content.example_figures||[])].includes(figure)||item.content.options.some(option=>option.image===figure)));
}
