import test from 'node:test';import assert from 'node:assert/strict';
import {createReadCache} from '../public/read-cache.js';
test('Navigation cache deduplicates, clones values, expires, and isolates accounts',async()=>{
 let now=0,calls=0;const c=createReadCache({clock:()=>now,ttl:10}),load=async()=>({count:++calls});
 const [a,b]=await Promise.all([c.read('A','/packages',load),c.read('A','/packages',load)]);assert.equal(calls,1);a.count=999;assert.equal(b.count,1);assert.equal((await c.read('A','/packages',load)).count,1);
 await c.read('B','/packages',load);assert.equal(calls,2);now=11;await c.read('A','/packages',load);assert.equal(calls,3);c.invalidate();await c.read('A','/packages',load);assert.equal(calls,4);
 await c.read('A','/exams/active',load);await c.read('A','/exams/active',load);assert.equal(calls,6);
});
test('Cache invalidation prevents a stale in-flight response from repopulating values; failures retry',async()=>{
 const c=createReadCache();let resolve,calls=0;const old=c.read('A','/dashboard',()=>new Promise(r=>resolve=r));await Promise.resolve();c.invalidate();resolve({old:true});await old;
 assert.deepEqual(await c.read('A','/dashboard',async()=>({new:true})),{new:true});c.invalidate();await assert.rejects(()=>c.read('A','/packages',async()=>{calls++;throw Error('offline');}));await c.read('A','/packages',async()=>{calls++;return {};});assert.equal(calls,2);
});
