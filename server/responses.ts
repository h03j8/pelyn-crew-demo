import {analyze,validate,type Draft} from '../src/model.js';
import {verifyResult} from './ai-proof.js';

type Writer = (path:string,body:string)=>Promise<unknown>;
const reply=(status:number,message:string)=>Response.json({message},{status,headers:{'Cache-Control':'no-store'}});
export function createHandler(write:Writer,isConfigured:()=>boolean){
 return async(request:Request):Promise<Response>=>{
  if(request.method!=='POST')return new Response(null,{status:405,headers:{Allow:'POST'}});
  const origin=request.headers.get('origin');
  if(origin!==new URL(request.url).origin)return reply(403,'허용되지 않은 요청입니다.');
  if(!request.headers.get('content-type')?.includes('application/json'))return reply(415,'JSON 요청이 필요합니다.');
  if(!isConfigured())return reply(503,'응답 저장소가 아직 연결되지 않았습니다. 결과는 계속 확인할 수 있습니다.');
  // Read a bounded stream rather than trusting Content-Length.
  const reader=request.body?.getReader();
  if(!reader)return reply(400,'입력 내용을 확인해주세요.');
  const chunks:Uint8Array[]=[];let size=0;
  try{
   while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>100_000){await reader.cancel();return reply(413,'입력 자료가 너무 큽니다.');}chunks.push(value);}
   const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
   const payload=JSON.parse(new TextDecoder().decode(bytes));
   if(!payload||payload.consent!==true||typeof payload.id!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(payload.id))return reply(400,'수집 동의와 응답 ID를 확인해주세요.');
   const input=payload.input;
   if(!input||typeof input!=='object')return reply(400,'입력 내용을 확인해주세요.');
   const keys:(keyof Draft)[]=['name','goal','source','output','skill','instruction'];
   for(const key of keys){if(typeof input[key]!=='string'||input[key].length>(key==='name'?120:6000))return reply(400,'입력 길이와 형식을 확인해주세요.');}
   const draft=Object.fromEntries(keys.map(key=>[key,input[key].trim()])) as Draft;
   if(Object.keys(validate(draft,keys)).length||!['고객 문의 분석','자료 요약','문안 작성'].includes(draft.skill))return reply(400,'필수 항목과 Skill을 확인해주세요.');
   let result;try{result=analyze(draft)}catch{return reply(400,'자료의 내용과 건수를 확인해주세요.');}
   if(payload.aiText!==undefined){
    if(!verifyResult(draft,payload.aiText,payload.aiSignature,process.env.OPENAI_API_KEY??''))return reply(400,'AI 결과 확인에 실패했습니다. 결과를 다시 생성한 후 제출해주세요.');
    Object.assign(result,{aiText:payload.aiText});
   }
   const record={schemaVersion:2,id:payload.id,submittedAt:new Date().toISOString(),consent:{accepted:true,noticeVersion:'2026-11-11'},input:draft,result};
   try{await write(`responses/${payload.id}.json`,JSON.stringify(record,null,2));}
   catch{return reply(502,'응답을 저장하지 못했습니다. 잠시 후 다시 시도해주세요.');}
   return Response.json({saved:true,id:payload.id},{status:201,headers:{'Cache-Control':'no-store'}});
  }catch{return reply(400,'올바른 JSON 입력이 필요합니다.');}
  finally{reader.releaseLock();}
 };
}
