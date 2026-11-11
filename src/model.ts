export type Draft = { name: string; goal: string; source: string; output: string; skill: string; instruction: string };
export const empty: Draft = {name:'',goal:'',source:'',output:'',skill:'고객 문의 분석',instruction:'업무 목적과 원하는 결과에 맞춰 작성하고, 자료에 없는 사실은 추가하지 마세요.'};
export const example: Draft = {...empty,name:'고객 문의 주간 요약 Crew',goal:'반복되는 고객 문의를 파악하고 먼저 확인할 문제를 정리해주세요.',source:'배송 문의 12건: 배송 예정일을 알기 어려워요.\n환불 문의 7건: 환불 처리 상태를 확인하고 싶어요.\n로그인 문의 4건: 비밀번호 재설정 메일이 오지 않아요.',output:'주요 이슈와 문의 건수를 표로 정리하고 우선순위 3가지를 보여주세요.'};
export const labels: Record<keyof Draft,string> = {name:'Crew 이름',goal:'업무 목적',source:'사용할 자료',output:'원하는 결과',skill:'사용할 Skill',instruction:'Skill 지시 사항'};
export function validate(d: Draft, keys: (keyof Draft)[]) {return Object.fromEntries(keys.filter(k=>!d[k].trim()).map(k=>[k,`${labels[k]}을 입력해주세요.`]));}
export function analyze(d: Draft) {
  const lines = d.source.replace(/\\n/g,'\n').split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
  if(!lines.length) throw new Error('정리할 자료를 한 줄 이상 입력해주세요.');
  const groups = new Map<string,{topic:string;count:number|null;details:string[];entries:number;unquantified:number}>();
  for (const line of lines) {
    const match = line.match(/^(.*?)\s*(\d[\d,]*)\s*건\s*[:：]?\s*(.*)$/);
    const parts = line.split(/[:：]/);
    const topic = (match ? match[1] : parts[0]).trim() || '기타 문의';
    const count = match ? Number(match[2].replaceAll(',','')) : null;
    if(count!==null && !Number.isSafeInteger(count)) throw new Error('건수가 너무 큽니다. 자료의 숫자를 확인해주세요.');
    const detail = (match ? match[3] : parts.slice(1).join(':')).trim() || line;
    const key = topic.replace(/\s/g,'').toLowerCase();
    const group = groups.get(key) || {topic,count:null,details:[],entries:0,unquantified:0};
    if(count!==null) group.count=(group.count??0)+count;
    else group.unquantified++;
    if(group.count!==null && !Number.isSafeInteger(group.count)) throw new Error('합산 건수가 너무 큽니다.');
    group.entries++;
    if(!group.details.includes(detail)) group.details.push(detail);
    groups.set(key,group);
  }
  const rows = [...groups.values()].sort((a,b)=>(b.count??-1)-(a.count??-1));
  const total=rows.reduce((sum,row)=>sum+(row.count??0),0);
  if(!Number.isSafeInteger(total)) throw new Error('전체 건수가 너무 큽니다.');
  return {rows,total,lineCount:lines.length,hasCounts:rows.some(r=>r.count!==null),table:/표|table/i.test(d.output),draft:{...d}};
}
export type Result = ReturnType<typeof analyze> & {aiText?:string;aiSignature?:string};
export function resultText(r:Result) {if(r.aiText)return [r.draft.name,'AI 생성 결과 · 사용 전 확인해주세요.',r.aiText].join('\n\n');return [r.draft.name,'규칙 기반 자료 정리 · AI 분석 아님',`업무 목적: ${r.draft.goal}`,`요청 형식: ${r.draft.output}`,`명시된 건수 합계: ${r.total}건`,...r.rows.map((row,i)=>`${i+1}. ${row.topic} · ${row.count===null?'건수 미기재':row.count+'건'}${row.unquantified?' (건수 미기재 '+row.unquantified+'줄 별도)':''}\n${row.details.join('\n')}`)].join('\n\n');}
