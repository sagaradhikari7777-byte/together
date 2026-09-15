import test from 'node:test';
import assert from 'node:assert/strict';
import {createHouse,mutate,visible} from '../lib/model.js';
const setup=()=>createHouse({name:'Test',names:['A','B','C','D'],seat:0}).h;
const expense=h=>({merchant:'Amazon',category:'Shopping',cents:1000,payer:0,visibility:'private',split:'half',date:'2026-09-14',sheet:h.sheets[0].id});
test('catalogs persist additions, renames, removals without changing historical expenses',()=>{
 const h=setup();mutate(h,0,{action:'expense',expense:expense(h)});
 mutate(h,0,{action:'catalog',kind:'merchants',operation:'add',name:'Local shop'});
 mutate(h,0,{action:'catalog',kind:'merchants',operation:'rename',previous:'Amazon',name:'Amazon AU'});
 mutate(h,0,{action:'catalog',kind:'merchants',operation:'remove',previous:'Amazon AU'});
 assert.equal(h.expenses[0].merchant,'Amazon');
 assert(visible(h,2).catalogs.merchants.includes('Local shop'));
 assert(!visible(h,0).catalogs.merchants.includes('Amazon'));
 assert.equal(visible(h,2).expenses.length,0);
 assert.throws(()=>mutate(h,0,{action:'catalog',kind:'merchants',operation:'add',name:'local SHOP'}),/already/);
 assert.throws(()=>mutate(h,0,{action:'catalog',kind:'categories',operation:'add',name:' '}));
});
test('sheet edits retain identity and pin toggles',()=>{
 const h=setup(),id=h.sheets[0].id;mutate(h,0,{action:'expense',expense:expense(h)});
 mutate(h,0,{action:'sheet-edit',id,name:'Holiday',start:'2026-09-10',end:'2026-09-20'});
 assert.equal(h.expenses[0].sheet,id);assert.equal(h.sheets[0].name,'Holiday');
 mutate(h,0,{action:'pin',id});assert.equal(h.sheets[0].pinned,false);
 mutate(h,0,{action:'pin',id});assert.equal(h.sheets[0].pinned,true);
 assert.throws(()=>mutate(h,0,{action:'sheet-edit',id,name:'No',start:'2026-09-20',end:'2026-09-10'}));
});
test('sheet deletion respects expense privacy, ownership and settlement locks',()=>{
 const h=setup(),id=h.sheets[0].id;mutate(h,0,{action:'expense',expense:expense(h)});
 assert.throws(()=>mutate(h,2,{action:'sheet-delete',id}),/protected/);
 mutate(h,0,{action:'sheet-delete',id});assert.equal(h.sheets.length,0);assert.equal(h.expenses.length,0);
 const h2=setup();mutate(h2,0,{action:'expense',expense:{...expense(h2),visibility:'shared'}});
 mutate(h2,0,{action:'settle',sheet:h2.sheets[0].id});
 assert.throws(()=>mutate(h2,0,{action:'sheet-delete',id:h2.sheets[0].id}),/protected/);
});
