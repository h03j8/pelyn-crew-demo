import {createHmac,timingSafeEqual} from 'node:crypto';
import type {Draft} from '../src/model.js';
const canonical=(d:Draft,text:string)=>JSON.stringify([d.name,d.goal,d.source,d.output,d.skill,d.instruction,text]);
export function signResult(d:Draft,text:string,key:string){return createHmac('sha256',key).update(canonical(d,text)).digest('hex');}
export function verifyResult(d:Draft,text:unknown,signature:unknown,key:string){
 if(typeof text!=='string'||!text.trim()||text.length>30000||typeof signature!=='string'||!key||!/^[a-f0-9]{64}$/.test(signature))return false;
 return timingSafeEqual(Buffer.from(signResult(d,text,key),'hex'),Buffer.from(signature,'hex'));
}
