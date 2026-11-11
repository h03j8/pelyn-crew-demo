import {test} from 'node:test';
import assert from 'node:assert/strict';
import {analyze,example,empty,validate,resultText} from './model.ts';
test('실제 줄바꿈과 건수로 예시 결과를 만든다',()=>{const r=analyze(example);assert.equal(r.rows.length,3);assert.equal(r.total,23);assert.equal(r.rows[0].topic,'배송 문의');assert.equal(r.table,true)});
test('같은 주제를 묶어 합산하고 건수순으로 정렬한다',()=>{const r=analyze({...example,source:'배송 문의 2건: 지연\n환불 문의 10건: 미처리\n배송 문의 3건: 확인'});assert.equal(r.rows.length,2);assert.equal(r.rows[0].topic,'환불 문의');assert.equal(r.rows[1].count,5);assert.equal(r.rows[1].details.length,2)});
test('건수 없는 자료를 임의로 수치화하지 않는다',()=>{const r=analyze({...example,source:'배송: 지연\n배송 2건: 확인\n기타: 문의'});assert.equal(r.total,2);assert.equal(r.rows[0].unquantified,1);assert.equal(r.rows[1].count,null)});
test('다른 입력과 출력 형식이 결과에 반영된다',()=>{const r=analyze({...example,source:'결제 1,200건: 실패',output:'목록으로'});assert.equal(r.total,1200);assert.equal(r.table,false);assert.match(resultText(r),/결제/)});
test('빈 입력과 지나치게 큰 숫자를 거부한다',()=>{assert.ok(validate(empty,['name','source']).source);assert.throws(()=>analyze({...example,source:' \n '}));assert.throws(()=>analyze({...example,source:'문의 999999999999999999999건: 테스트'}))});
test('태그 입력은 데이터로 보존한다',()=>{assert.equal(analyze({...example,source:'<script>alert(1)</script>'}).rows[0].topic,'<script>alert(1)</script>')});
