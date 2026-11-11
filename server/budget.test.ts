import {test} from 'node:test';
import assert from 'node:assert/strict';
import {reserveSlot,AI_BUDGET_KRW,AI_RESERVATION_KRW} from './budget.ts';
test('전체 60회까지만 예약하며 이후는 차단한다',async()=>{
 const occupied=new Set<number>();let reserved=0;
 for(let i=0;i<75;i++)if(await reserveSlot(async slot=>{if(occupied.has(slot))return 'exists';occupied.add(slot);return 'claimed'}))reserved++;
 assert.equal(reserved,60);assert.equal(reserved*AI_RESERVATION_KRW,AI_BUDGET_KRW);
});
test('동시 75요청에서도 60개 슬롯을 초과하지 않는다',async()=>{
 const occupied=new Set<number>();
 const results=await Promise.all(Array.from({length:75},()=>reserveSlot(async slot=>{await Promise.resolve();if(occupied.has(slot))return 'exists';occupied.add(slot);return 'claimed'})));
 assert.equal(results.filter(Boolean).length,60);
});
test('재시작 후 기존 예약을 유지하고 59개 사용 상태에서 1개만 허용한다',async()=>{
 const occupied=new Set(Array.from({length:59},(_,i)=>i+1));let claims=0;
 assert.equal(await reserveSlot(async slot=>{assert.equal(slot,60);claims++;return 'claimed'},occupied),true);assert.equal(claims,1);
});
