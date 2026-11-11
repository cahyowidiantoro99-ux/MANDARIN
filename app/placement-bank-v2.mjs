// Versioned server-owned question selection; answer keys never go to the active client.
import {readFileSync} from 'node:fs';
import {randomInt} from 'node:crypto';
export const placementBankV2=JSON.parse(readFileSync(new URL('../data/placement/bank-v2.json',import.meta.url),'utf8'));
export function makePlacementPlan(draw=randomInt){
 const result=[];for(const level of placementBankV2.policy.levels)for(const kind of placementBankV2.policy.kind_order){
 const pool=placementBankV2.questions.filter(q=>q.level===level&&q.kind===kind);if(pool.length<2)throw Error('Insufficient placement variants');
 const q=structuredClone(pool[draw(pool.length)]);for(let i=q.options.length-1;i>0;i--){const j=draw(i+1);[q.options[i],q.options[j]]=[q.options[j],q.options[i]];}for(let i=q.tokens.length-1;i>0;i--){const j=draw(i+1);[q.tokens[i],q.tokens[j]]=[q.tokens[j],q.tokens[i]];}result.push(q);
 }return result;
}
export function publicPlacementQuestion(q){return {id:q.id,level:q.level,kind:q.kind,prompt:q.prompt,tokens:q.tokens,options:q.options,show_pinyin:false};}
export function evaluatePlacementAnswer(plan,state,{question_id,option_id}){
 if(state.completed)throw Error('Placement already completed');const current=plan[state.index];
 if(!current||current.id!==question_id)throw Error('Answer must follow question order');if(!current.options.some(o=>o.id===option_id))throw Error('Invalid option');
 const correct=current.correct_id===option_id,completed=!correct||state.index===29;
 return {index:state.index+1,completed,assigned_level:completed?current.level:null,stop_reason:completed?(correct?'all_correct':'first_error'):null};
}
