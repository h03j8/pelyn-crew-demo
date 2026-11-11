import {put,head,list} from '@vercel/blob';

export const AI_BUDGET_KRW=3000;
export const AI_RESERVATION_KRW=50;
const PREFIX='budget/ai-pilot-v1/';
const SLOTS=AI_BUDGET_KRW/AI_RESERVATION_KRW;
type Claim=(slot:number)=>Promise<'claimed'|'exists'>;
export async function reserveSlot(claim:Claim,occupied=new Set<number>()){
 for(let slot=1;slot<=SLOTS;slot++){
  if(occupied.has(slot))continue;
  if(await claim(slot)==='claimed')return true;
 }
 return false;
}
export async function reserveAiBudget():Promise<'reserved'|'exhausted'|'unavailable'>{
 if(!process.env.BLOB_READ_WRITE_TOKEN)return 'unavailable';
 try{
  const files=await list({prefix:PREFIX,limit:1000});
  const occupied=new Set(files.blobs.map(blob=>Number(blob.pathname.slice(PREFIX.length).replace('.json',''))));
  const reserved=await reserveSlot(async(slot)=>{
   const path=`${PREFIX}${String(slot).padStart(3,'0')}.json`;
   try{
    await put(path,JSON.stringify({reservedKrw:AI_RESERVATION_KRW,createdAt:new Date().toISOString()}),{access:'private',contentType:'application/json',addRandomSuffix:false,allowOverwrite:false});
    return 'claimed';
   }catch(error){
    // Concurrent requests may try the same slot; never overwrite an allocation.
    try{await head(path);return 'exists';}catch{throw error;}
   }
  },occupied);
  return reserved?'reserved':'exhausted';
 }catch{return 'unavailable';}
}
