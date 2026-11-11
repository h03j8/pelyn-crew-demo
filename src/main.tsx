import React, {useEffect,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {empty,example,labels,resultText,validate,type Draft,type Result} from './model';
import {ResponseCollection} from './ResponseCollection';
import {RuleResult} from './RuleResult';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './style.css';
import './refinement.css';
import './neutral.css';
import './web.css';

const steps=['업무 예시','Crew 작성','Skill 설정','실행·결과'];
function App(){
 const [step,setStep]=useState(0),[draft,setDraft]=useState<Draft>({...empty}),[errors,setErrors]=useState<Record<string,string>>({}),[result,setResult]=useState<Result|null>(null),[running,setRunning]=useState(false),[notice,setNotice]=useState('');
 const heading=useRef<HTMLHeadingElement>(null);
 const requestRef=useRef<AbortController|null>(null);
 const [accessCode,setAccessCode]=useState(''),[aiConsent,setAiConsent]=useState(false);
 useEffect(()=>()=>requestRef.current?.abort(),[]);
 useEffect(()=>{heading.current?.focus();window.scrollTo(0,0)},[step,result]);
 const go=(n:number)=>{setErrors({});setNotice('');if(n<3)setResult(null);setStep(n)};
 const update=(key:keyof Draft,value:string)=>{setDraft(d=>({...d,[key]:value}));setErrors(e=>{const next={...e};delete next[key];return next})};
 function check(keys:(keyof Draft)[]){const next=validate(draft,keys);setErrors(next);const first=Object.keys(next)[0];if(first){setTimeout(()=>document.getElementById(first)?.focus(),0);return false}return true}
 async function run(){
  if(requestRef.current||!check(['name','goal','source','output','instruction']))return;
  if(!accessCode.trim()||!aiConsent){setNotice('참여 코드를 입력하고 AI 처리 안내에 동의해주세요.');document.getElementById(!accessCode.trim()?'access-code':'ai-consent')?.focus();return;}
  const snapshot=Object.fromEntries(Object.entries(draft).map(([k,v])=>[k,v.trim()])) as Draft;
  const controller=new AbortController();requestRef.current=controller;setRunning(true);setNotice('');
  const timeout=setTimeout(()=>controller.abort(),55000);
  try{
   const response=await fetch('/api/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({input:snapshot,accessCode:accessCode.trim(),aiConsent:true}),signal:controller.signal});
   const data=await response.json().catch(()=>null);
   if(response.ok&&data?.mode==='rules'&&Array.isArray(data.result?.rows)){
    if(!controller.signal.aborted){setResult(data.result);setNotice(data.message);}
    return;
   }
   if(!response.ok||typeof data?.text!=='string'||!data.text.trim())throw Error(data?.message||'AI 결과를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.');
   if(!controller.signal.aborted)setResult({draft:snapshot,rows:[],total:0,lineCount:snapshot.source.split(/\r?\n/).filter(Boolean).length,hasCounts:false,table:false,aiText:data.text,aiSignature:data.signature});
  }catch(error){if(!controller.signal.aborted)setNotice(error instanceof Error?error.message:'AI 실행에 실패했습니다.');else if(requestRef.current===controller)setNotice('실행이 취소되었거나 응답 시간이 초과됐습니다. 입력은 유지됩니다.');}
  finally{clearTimeout(timeout);if(requestRef.current===controller){requestRef.current=null;setRunning(false);}}
 }
 function cancel(){requestRef.current?.abort();setNotice('실행을 취소했습니다. 이미 시작된 AI 처리는 과금될 수 있습니다.');}
 function download(){if(!result)return;const url=URL.createObjectURL(new Blob([resultText(result)],{type:'text/plain;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='Crew-결과.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);setNotice('결과 파일을 다운로드했습니다.')}
 const button=(text:string,action:()=>void,primary=false)=><button type="button" className={`btn ${primary?'primary':''}`} onClick={action} disabled={running}>{text}</button>;
 const field=(key:keyof Draft,short=false)=><div className="field" key={key}><label htmlFor={key}>{labels[key]}<em>필수</em></label>{short?<input id={key} value={draft[key]} onChange={e=>update(key,e.target.value)} maxLength={120} placeholder={example[key]} aria-required="true" aria-invalid={!!errors[key]} aria-describedby={`${key}-hint ${errors[key]?key+'-error':''}`}/>:<textarea id={key} value={draft[key]} onChange={e=>update(key,e.target.value)} maxLength={6000} rows={key==='source'?6:3} placeholder={example[key]} aria-required="true" aria-invalid={!!errors[key]} aria-describedby={`${key}-hint ${errors[key]?key+'-error':''}`}/>}<p className={key==='name'||key==='goal'?'sr-only':'hint'} id={`${key}-hint`}>{key==='source'?'개인정보·연락처·회사 기밀은 제외해주세요.':key==='output'?'예: 상품 소개 문안, 회의 요약, 문의 분석':key==='instruction'?'말투·대상·분량 등 필요한 조건을 적어주세요.':short?'최대 120자':'최대 6,000자'}</p>{errors[key]&&<p className="error" role="alert" id={`${key}-error`}>{errors[key]}</p>}</div>;
 const hasDraft=Boolean(draft.name.trim()||draft.goal.trim()||draft.source.trim()||draft.output.trim());
 const startExample=()=>{if(hasDraft&&!window.confirm('작성 중인 내용을 예시로 바꾸겠습니까?'))return;setDraft({...example});setResult(null);go(1)};
 const title=(text:string,description:string)=><><h1 ref={heading} tabIndex={-1}>{text}</h1><p className="lead">{description}</p></>;
 return <><header className="top"><a className="brand" href="#" onClick={e=>{e.preventDefault();if(!running)go(0)}}><span className="mark">p.</span>펠린AI<span className="brand-sub">WORKSPACE</span></a><span className="prototype">로그인 없이 체험하기</span></header><div className="workspace"><aside><div className="workspace-name">체험 워크스페이스</div><a className="nav-active" href="#" onClick={e=>{e.preventDefault();if(!running)go(0)}}>◈ <span>Crew</span></a><div className="aside-bottom">첫 업무를 함께 시작해요</div></aside><main><div className="breadcrumb">워크스페이스 <span>/</span> Crew <span>/</span><b>첫 Crew 만들기</b></div><section className={`panel screen-${step===0?'home':'edit'}`}><div className="panel-head">첫 Crew 만들기 <span>로그인 없이 진행</span></div><nav className="progress-nav" aria-label="Crew 시작 단계"><div className="progress-caption"><span>첫 업무 시작하기</span><strong>{result&&step===3?'모든 단계 완료':`${step+1} / 4 단계 · ${steps[step]}`}</strong></div><div className="progress-track" aria-hidden="true"><span style={{width:`${step/3*100}%`}}/></div><ol className="steps">{steps.map((name,i)=><li key={name}><button className={`step ${i<step||result&&step===3?'done':i===step?'current':''}`} disabled={i>=step||running} aria-current={i===step?'step':undefined} onClick={()=>go(i)}><span className="num">{i<step||result&&step===3?'✓':i+1}</span><span>{name}<small>{i<step?'완료':i===step?'현재 단계':'이후 단계'}</small></span></button></li>)}</ol></nav>{notice&&<p className="callout" role="status">{notice}</p>}
 {step===0&&<>{title('예시로 시작하는 첫 Crew','예시를 내 업무에 맞게 바꿔보세요.')}<div className="example-layout"><section className="example-preview"><span className="tag">추천 업무 예시</span><h2 className="example-title">고객 문의 주간 요약</h2><p className="example-description">흩어진 문의를 주제별로 묶고,<br/>먼저 확인할 문제를 정리해요.</p><div className="preview-document"><div className="document-heading"><span>결과 미리보기</span><span>REPORT</span></div><h3>이번 주 고객 문의</h3><div className="sample-output"><div><b>주요 이슈</b><b>문의 건수</b></div>{[['배송 문의','12건'],['환불 문의','7건'],['로그인 문의','4건']].map(([a,b])=><div key={a}><span>{a}</span><strong>{b}</strong></div>)}</div><p className="document-note">문의 건수가 많은 순서로 우선순위 정리</p></div></section><section className="example-guide"><h2>이렇게 작성하면 돼요</h2>{(['goal','source','output'] as const).map((key,i)=><div className="guide-row" key={key}><span className="guide-number">{i+1}</span><div><strong>{labels[key]}</strong><p className="preserve">{example[key]}</p></div></div>)}</section></div><div className="actions home-actions">{button('예시로 시작하기 →',startExample,true)}</div></>}
 {step===1&&<>{title('어떤 업무를 맡길까요?','채워진 예시를 원하는 업무로 바꿔주세요.')}<form onSubmit={e=>{e.preventDefault();if(check(['name','goal','source','output']))go(2)}} noValidate><div className="form-grid"><div>{field('name',true)}{field('goal')}{field('source')}{field('output')}</div></div><div className="actions"><span className="left">새로고침하면 작성 내용이 사라져요.</span>{button('← 이전',()=>go(0))}<button className="btn primary" type="submit">Skill 설정하기 →</button></div></form></>}
 {step===2&&<>{title('어떤 방식으로 작업할까요?','업무 방식을 고르고 필요한 조건을 적어주세요.')}<section className="box"><h2>업무 방식 · Skill</h2>{['고객 문의 분석','자료 요약','문안 작성'].map(skill=><label className="skill-option" key={skill}><input type="radio" name="skill" checked={draft.skill===skill} onChange={()=>update('skill',skill)}/><span><b>{skill}</b><br/><span className="hint">{skill==='고객 문의 분석'?'문의의 주제와 우선순위를 분석해요.':skill==='문안 작성'?'소개·제안·연락 문안을 작성해요.':'자료의 핵심 내용을 요약해요.'}</span></span></label>)}</section>{field('instruction')}<div className="actions">{button('← 이전',()=>go(1))}{button('설정 확인하기 →',()=>{if(check(['instruction'])){setResult(null);go(3)}},true)}</div></>}
 {step===3&&!result&&<>{title('이제 결과를 만들어볼까요?','참여 코드를 입력하고 실행해주세요.')}<details className="box"><summary>입력 내용 확인 · {draft.name}</summary>{(['name','goal','source','output','skill','instruction'] as const).map(key=><div className="summary-row" key={key}><strong>{labels[key]}</strong>{draft[key]}</div>)}</details><div className="ai-access"><label htmlFor="access-code">테스트 참여 코드</label><input id="access-code" value={accessCode} onChange={e=>setAccessCode(e.target.value)} disabled={running} maxLength={80} autoComplete="off" placeholder="전달받은 참여 코드를 입력하세요"/><label className="collection-consent"><input id="ai-consent" type="checkbox" checked={aiConsent} onChange={e=>setAiConsent(e.target.checked)} disabled={running}/><span>입력한 내용을 OpenAI로 보내 AI 결과를 생성하는 데 동의합니다.</span></label><p className="hint">체험 응답 보내기는 결과 화면에서 따로 선택할 수 있어요.</p></div>{running&&<p role="status" className="run-title"><span className="spinner"/>결과를 작성하고 있어요. 최대 약 50초 걸릴 수 있어요.</p>}<div className="actions">{running?<button className="btn" onClick={cancel}>실행 취소</button>:<>{button('← 설정 수정',()=>go(2))}{button('결과 만들기 →',run,true)}</>}</div></>}
 {step===3&&result&&<>{title('첫 업무 결과가 도착했어요',result.aiText?'내용을 확인하고 필요하면 수정해보세요.':'입력 자료를 규칙에 따라 정리한 기본 결과입니다.')}<div className="callout"><h3>✓ {result.draft.name}</h3><p>{result.aiText?'AI 생성 결과 · 사실과 표현을 확인한 뒤 사용해주세요.':'기본 자료 정리 결과 · AI 미사용'}</p></div><section className="box"><h2>업무 결과</h2>{result.aiText?<div className="ai-output"><ReactMarkdown remarkPlugins={[remarkGfm]}>{result.aiText}</ReactMarkdown></div>:<RuleResult result={result}/>}</section><details className="box"><summary>입력한 업무와 요청 확인</summary>{(['goal','source','output','skill','instruction'] as const).map(key=><div className="summary-row" key={key}><strong>{labels[key]}</strong>{result.draft[key]}</div>)}</details><div className="actions">{button('결과 다운로드',download)}{button('내용 수정하기',()=>go(1))}</div></>}
 {step===3&&result&&<ResponseCollection key={JSON.stringify(result)} result={result}/>}
</section><footer className="page-footer">PELYN AI<span>업무의 시작부터, 첫 결과까지.</span></footer></main></div></>;
}
createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);
