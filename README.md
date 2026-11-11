# 펠린AI Crew 웹 체험

기존 `prototype` 및 `figma-export`의 디자인을 바탕으로 React + Vite + TypeScript로 구현했습니다. 결과는 브라우저에서 계산하며, 선택 동의 후 응답 보내기를 누르면 입력·결과가 Vercel 비공개 Blob에 저장됩니다. 로그인과 Supabase는 필요 없습니다. 새로고침하면 화면의 입력은 초기화됩니다.

## 실행

Node.js 22.12 이상 권장.

```sh
npm install
npm run dev
```

## 검증 및 빌드

```sh
npm test
npm run build
npm run preview
```

## Vercel 배포

GitHub에 프로젝트를 올린 뒤 Vercel에서 Import Project를 선택합니다. 상위 폴더 전체를 저장소로 올렸다면 Root Directory를 `web`으로 설정합니다. `web`만 올렸다면 기본 루트를 사용합니다.

- Framework: Vite
- Build Command: `npm run build`
- Output Directory: `dist`
- 서버 환경변수: `BLOB_READ_WRITE_TOKEN`
- 로그인 / Supabase / AI API 키: 불필요

또는 `web` 폴더에서 Vercel CLI로 `vercel`을 실행하고 미리보기 확인 후 `vercel --prod`로 배포할 수 있습니다. Vercel 계정 인증은 별도 필요합니다.

### 응답 수집 활성화

1. Vercel 프로젝트의 Storage에서 Blob 저장소를 만들고 접근 권한을 **Private**으로 선택합니다.
2. 저장소를 프로젝트에 연결하고 Production 및 필요한 Preview 환경에 `BLOB_READ_WRITE_TOKEN`을 연결합니다.
3. 다시 배포합니다. 이 키에 `VITE_` 접두어를 붙이거나 코드에 넣지 마세요.
4. 배포 주소에서 예시 실행 → 수집 동의 → 응답 보내기를 테스트합니다. 저장 성공 문구와 Storage의 `responses/<UUID>.json` 파일을 모두 확인합니다.

Vercel의 Blob 대시보드에서 소유자 계정으로 파일을 확인·다운로드할 수 있습니다. 공개 응답 조회 API는 제공하지 않습니다. 아래 내보내기 스크립트로 모든 응답을 하나의 JSON으로 합칠 수 있습니다.

```sh
node --env-file=.env.local scripts/export-responses.mjs
```

`.env.local`에는 소유자만 보관하는 Blob 키를 넣습니다. 내려받은 응답 폴더와 키는 Git에서 제외됩니다. 수집 목적이 끝나면 대시보드에서 수집 파일을 삭제하세요.

`npm run dev`는 Vite 프런트엔드만 실행하므로 저장 API가 없습니다. API를 함께 테스트하려면 Vercel CLI의 `vercel dev`와 로컬 환경변수, 또는 Blob이 연결된 Preview 배포를 사용하세요. 미연결·실패 상태는 저장 성공으로 표시하지 않습니다.

응답별 파일로 저장하고 재시도에는 같은 ID를 사용해 중복 저장을 방지합니다. 입력 길이·형식·동의를 서버에서 검증하고 결과도 다시 계산합니다. 익명 쓰기 API이므로 공개 모집을 크게 확대하기 전에는 Vercel Firewall의 요청 제한 규칙을 추가하세요. 저장·요청 사용량은 Vercel 요금제에 따라 집계됩니다.

## 지원 범위

- 예시 적용 또는 직접 입력 → Crew 작성 → Skill 설정 → 결과
- 같은 주제 묶기, 명시된 건수 합산, 건수순 정렬
- 한 줄에 `배송 문의 12건: 배송일 확인` 형식 권장
- 건수 없는 자료는 미기재로 표시하며, 명시된 건수 합계에서 제외
- 원하는 결과에 `표` 또는 `table`이 있으면 표, 그 외에는 목록
- 고객 문의 분석 Skill에만 건수 상위 3개 주제 표시
- 결과 텍스트 다운로드 및 자료 수정 후 재실행
- 목적과 자유 문장 지시 사항은 기록용. 의미 해석, AI 생성, 외부 사실 조회는 미지원

실제 자유 입력 분석이 필요하면 Vercel 서버 함수에서 AI API를 호출하도록 확장해야 합니다. API 비밀 키는 브라우저용 환경변수에 넣지 않습니다.
