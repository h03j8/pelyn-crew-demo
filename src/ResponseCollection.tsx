import {useEffect,useRef,useState} from 'react';
import type {Result} from './model';

export function ResponseCollection({result}:{result:Result}){
 const [consent,setConsent]=useState(false),[status,setStatus]=useState<'idle'|'saving'|'saved'|'error'>('idle'),[message,setMessage]=useState('');
 const id=useRef(crypto.randomUUID());
 const busy=useRef(false);
 const controller=useRef<AbortController|null>(null);
 useEffect(()=>()=>controller.current?.abort(),[]);
 async function submit(){
  if(!consent||busy.current||status==='saved')return;
  busy.current=true;setStatus('saving');setMessage('응답을 저장하고 있습니다.');
  controller.current=new AbortController();
  const timeout=setTimeout(()=>controller.current?.abort(),20000);
  try{
   const response=await fetch('/api/responses',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:id.current,consent:true,input:result.draft}),signal:controller.current.signal});
   const data=await response.json().catch(()=>null);
   if(!response.ok||data?.saved!==true)throw new Error(data?.message||'응답 저장에 실패했습니다. 배포 환경과 저장소 연결을 확인해주세요.');
   setStatus('saved');setMessage('응답이 저장됐습니다. 참여해주셔서 감사합니다.');
  }catch(error){setStatus('error');setMessage(error instanceof Error&&error.name!=='AbortError'?error.message:'연결이 지연되고 있습니다. 다시 시도해주세요.');}
  finally{clearTimeout(timeout);busy.current=false;}
 }
 return <section className="box collection"><h2>체험 응답 보내기</h2><p>서비스 개선을 위해 이번에 입력한 업무 목적·자료·설정과 생성 결과, 제출 시각을 수집합니다. 응답은 비공개로 보관됩니다. 이름·연락처 등 개인정보나 회사 기밀은 입력하지 마세요.</p><label className="collection-consent"><input type="checkbox" checked={consent} disabled={status==='saving'||status==='saved'} onChange={e=>setConsent(e.target.checked)}/><span>입력 내용과 결과 수집에 동의합니다. (선택)</span></label><p className="hint">동의하지 않아도 결과 확인과 다운로드를 이용할 수 있습니다.</p><button type="button" className="btn primary" disabled={!consent||status==='saving'||status==='saved'} onClick={submit}>{status==='saved'?'응답 저장 완료':status==='saving'?'저장 중…':status==='error'?'다시 보내기':'응답 보내기'}</button>{message&&<p role="status" className={status==='error'?'error':'hint'}>{message}</p>}</section>;
}
