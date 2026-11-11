import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHandler} from './responses.ts';
import {example} from '../src/model.ts';

const payload={id:'12345678-1234-4123-8123-123456789abc',consent:true,input:example};
const request=(data:unknown=payload,origin='https://example.com')=>new Request('https://example.com/api/responses',{method:'POST',headers:{origin,'Content-Type':'application/json'},body:JSON.stringify(data)});
test('동의한 응답을 JSON으로 저장하며 결과는 서버에서 계산한다',async()=>{
 let path='',record:any;
 const handler=createHandler(async(p,b)=>{path=p;record=JSON.parse(b)},()=>true);
 const response=await handler(request({...payload,result:{total:99999},email:'discard@example.com'}));
 assert.equal(response.status,201);assert.equal(record.result.total,23);assert.equal(record.email,undefined);assert.equal(record.consent.accepted,true);assert.match(path,/^responses\/.*\.json$/);assert.equal((await response.json()).saved,true);
});
test('동의 없는 응답과 잘못된 필드·ID는 저장하지 않는다',async()=>{
 let writes=0;const handler=createHandler(async()=>{writes++},()=>true);
 for(const data of [{...payload,consent:false},{...payload,id:'../hack'},{...payload,input:{...example,name:''}},{...payload,input:{...example,source:7}},{...payload,input:{...example,skill:'unknown'}}])assert.equal((await handler(request(data))).status,400);
 assert.equal(writes,0);
});
test('다른 출처, GET 및 큰 본문을 거부한다',async()=>{
 const handler=createHandler(async()=>{},()=>true);
 assert.equal((await handler(request(payload,'https://other.com'))).status,403);
 assert.equal((await handler(new Request('https://example.com/api/responses'))).status,405);
 assert.equal((await handler(request({...payload,padding:'x'.repeat(100001)}))).status,413);
});
test('미연결 및 저장 실패를 성공으로 표시하지 않는다',async()=>{
 assert.equal((await createHandler(async()=>{},()=>false)(request())).status,503);
 assert.equal((await createHandler(async()=>{throw Error('secret token')},()=>true)(request())).status,502);
});
test('잘못된 JSON과 위험한 건수를 거부한다',async()=>{
 const handler=createHandler(async()=>{},()=>true);
 assert.equal((await handler(new Request('https://example.com/api/responses',{method:'POST',headers:{origin:'https://example.com','Content-Type':'application/json'},body:'{'}))).status,400);
 assert.equal((await handler(request({...payload,input:{...example,source:'문의 999999999999999999999999건: test'}}))).status,400);
});
