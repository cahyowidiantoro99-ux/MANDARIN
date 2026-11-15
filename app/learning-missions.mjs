export function learningMissions(counts={},practice=0){
 const c=k=>Number(counts[k]||0);
 return [
 {title:'Review 10 kosakata atau idiom berbeda',current:Math.min(10,c('review')+c('chengyu_review')),target:10},
 {title:'Selesaikan 1 latihan bahasa',current:Math.min(1,Number(practice)+['grammar','pair_quick','pair_bank','atlas_pinyin','exam_practice','matching','sentence','listening','story'].reduce((n,k)=>n+c(k),0)),target:1},
 {title:'Jawab 3 recall quiz dengan benar',current:Math.min(3,c('recall')),target:3}
 ];
}
