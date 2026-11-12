import test from 'node:test';import assert from 'node:assert/strict';import {postgresTransaction} from '../app/postgres-transaction.mjs';
const wrap=c=>({run:sql=>c.query(sql)});
test('Independent PostgreSQL transactions overlap instead of blocking all users',async()=>{
 let connections=0,released=0,open;const gate=new Promise(r=>open=r),pool={connect:async()=>({query:async()=>{},release(){released++;}})};
 const job=()=>postgresTransaction(pool,wrap,async()=>{if(++connections===2)open();await gate;return true;});
 await Promise.race([Promise.all([job(),job()]),new Promise((_,reject)=>setTimeout(()=>reject(Error('users blocked each other')),1000))]);assert.equal(released,2);
});
test('Serializable conflict rolls back and retries once; business errors are never retried',async()=>{
 let attempts=0,sql=[],released=0;const pool={connect:async()=>({query:async s=>sql.push(s),release(){released++;}})};
 const value=await postgresTransaction(pool,wrap,async()=>{if(++attempts===1)throw Object.assign(Error('conflict'),{code:'40001'});return 9;});assert.equal(value,9);assert.equal(attempts,2);assert.equal(sql.filter(s=>s==='COMMIT').length,1);assert.equal(sql.filter(s=>s==='ROLLBACK').length,1);assert.equal(released,2);
 let failures=0;await assert.rejects(()=>postgresTransaction(pool,wrap,async()=>{failures++;throw Error('not permitted');}),/not permitted/);assert.equal(failures,1);
});
