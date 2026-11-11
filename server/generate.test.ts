import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createGenerateHandler} from './generate.ts';
import {signResult,verifyResult} from './ai-proof.ts';
import {example} from '../src/model.ts';
const input={...example,name:'학원 연락 문안',goal:'가망 고객에게 상품 소개',source:'학원 원장 5명, 조교 5명을 대상으로 학생관리 리포트를 파일럿 테스트. 시험지 촬영 → 리포트 완성 → 학부모 알림톡',output:'컨택 문안을 작성해주세요.',skill:'문안 작성'};
const payload={input,accessCode:'test-code',aiConsent:true};
const request=(data:unknown=payload)=>new Request('https://example.com/api/generate',{method:'POST',headers:{origin:'https://example.com','Content-Type':'application/json'},body:JSON.stringify(data)});
const config=()=>({key:'fake-test-key',code:'test-code'});
test('업무 목적과 자료를 AI로 전달하고 응답의 텍스트만 표시한다',async()=>{
 let calls=0;
 const mock:typeof fetch=async(_url,options)=>{
  calls++;const body=JSON.parse(options?.body as string);
  assert.equal(body.model,'gpt-5-mini');assert.equal(body.max_output_tokens,3500);assert.equal(body.store,false);
  assert.ok(body.input.includes('컨택 문안'));assert.ok(body.instructions.includes('업무 목적'));
  return Response.json({status:'completed',output:[{type:'reasoning',summary:[]},{type:'message',content:[{type:'output_text',text:'안녕하세요, 원장님. 학생관리 리포트 파일럿 참여를 제안드립니다.'}]}]});
 };
 const response=await createGenerateHandler(config,mock)(request());const data=await response.json();
 assert.equal(response.status,200);assert.equal(calls,1);assert.match(data.text,/원장님/);assert.equal(verifyResult(input,data.text,data.signature,'fake-test-key'),true);
});
test('키 미설정·잘못된 코드·동의 없음은 유료 API를 호출하지 않는다',async()=>{
 let calls=0;const mock:typeof fetch=async()=>{calls++;return Response.json({})};
 assert.equal((await createGenerateHandler(()=>({key:'',code:''}),mock)(request())).status,503);
 const handler=createGenerateHandler(config,mock);
 assert.equal((await handler(request({...payload,accessCode:'wrong'}))).status,403);
 assert.equal((await handler(request({...payload,aiConsent:false}))).status,400);
 assert.equal(calls,0);
});
test('긴 입력과 빠진 필드를 거부한다',async()=>{
 const handler=createGenerateHandler(config);
 assert.equal((await handler(request({...payload,input:{...input,goal:''}}))).status,400);
 assert.equal((await handler(request({...payload,input:{...input,source:'가'.repeat(6001)}}))).status,400);
});
test('API 오류·불완전 답변·빈 답변을 성공으로 표시하지 않는다',async()=>{
 for(const [upstream,status] of [[new Response('',{status:429}),429],[new Response('',{status:401}),502],[Response.json({status:'incomplete',output:[]}),502],[Response.json({status:'completed',output:[]}),502]] as const){
  const mock:typeof fetch=async()=>upstream;
  assert.equal((await createGenerateHandler(config,mock)(request())).status,status);
 }
});
test('AI 결과를 수정하거나 다른 입력에 붙이면 서명 검증이 실패한다',()=>{
 const signature=signResult(input,'결과','fake-test-key');
 assert.equal(verifyResult(input,'위조 결과',signature,'fake-test-key'),false);
 assert.equal(verifyResult({...input,goal:'다른 요청'},'결과',signature,'fake-test-key'),false);
});
