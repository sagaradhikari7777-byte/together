import assert from 'node:assert/strict';
import {getDatabase} from '@netlify/database';
const base = process.argv[2];
if (!base) throw new Error('Supply the Together site URL');
const request = async (body, key='') => {
 const r=await fetch(new URL('/api/household',base),{signal:AbortSignal.timeout(30000),method:'POST',headers:{'Content-Type':'application/json',authorization:'Bearer '+key},body:JSON.stringify(body)});
 const data=await r.json(); return {status:r.status,...data};
};
let house;
try {
 const owner=await request({action:'create',name:'Temporary deployment check',names:['Test A','Test B','Test C','Test D'],seat:0});
 assert.equal(owner.status,200,JSON.stringify(owner)); house=owner.data.id;
 const joined=await request({action:'join',house,invite:owner.data.invite,seat:2}); assert.equal(joined.status,200);
 const now=await request({action:'read',house},owner.key); assert.equal(now.status,200);
 const expense={merchant:'Deployment check',cents:1001,category:'Groceries',payer:0,visibility:'shared',split:'half',date:new Date().toISOString().slice(0,10),sheet:now.data.sheets[0].id,notes:''};
 const saved=await request({action:'expense',house,rev:now.data.rev,expense},owner.key); assert.equal(saved.status,200,JSON.stringify(saved));
 const read=await request({action:'read',house},joined.key); assert.equal(read.data.expenses[0].cents,1001);
 const stale=await request({action:'expense',house,rev:now.data.rev,expense},owner.key); assert.equal(stale.status,409);
 const privateSave=await request({action:'expense',house,rev:read.data.rev,expense:{...expense,visibility:'private'}},owner.key); assert.equal(privateSave.status,200);
 const other=await request({action:'read',house},joined.key); assert.equal(other.data.expenses.length,1);
 const bad=await request({action:'read',house},'x'.repeat(64)); assert.equal(bad.status,401);
 console.log('PASS: create, join, save, cross-member read, stale-write rejection, private-record isolation, invalid-key rejection');
} finally {
 if(house){
  const connectionString=process.env.TEST_DATABASE_URL;
  if(connectionString){
   const db=getDatabase({connectionString});
   try {
    await db.sql`DELETE FROM together_state WHERE key = ${'together:house:'+house}`;
    console.log('Temporary test household removed.');
   } catch { console.log('Test household retained: cleanup credentials lack delete access.'); }
  } else console.log('Test household retained; set TEST_DATABASE_URL to enable cleanup.');
 }
}
