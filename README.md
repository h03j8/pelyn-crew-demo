# 펠린AI Crew AI 체험

React + Vite + TypeScript, Vercel Functions, OpenAI Responses API로 구성한 로그인 없는 업무 체험입니다. 입력 폼은 한 열로 유지합니다.

## 개발 및 검증

Node.js 24 이상을 권장합니다.

```sh
npm install
npm test
npm run build
```

`npm run dev`는 프런트엔드만 실행합니다. 실제 API까지 테스트하려면 Vercel Preview 배포 또는 `vercel dev`를 사용하세요.

## Vercel 환경변수

모두 서버 전용입니다. VITE_ 접두어를 붙이거나 Git에 올리지 마세요.

- `OPENAI_API_KEY`: OpenAI 프로젝트 API 키, API 결제·사용 한도 별도 확인
- `TEST_ACCESS_CODE`: 참가자에게 전달하는 공통 테스트 코드
- `BLOB_READ_WRITE_TOKEN`: 응답을 수집할 때만 필요한 비공개 Blob 키

키와 참여 코드 둘 다 있어야 AI를 호출할 수 있습니다. 환경변수 추가 후 재배포가 필요합니다.

```sh
npx vercel --prod
```

Framework Vite, build command `npm run build`, output `dist`. 이 저장소의 루트가 web 프로젝트입니다.

## 사용자 흐름

예시 선택 또는 직접 작성 → 업무·자료·원하는 결과 입력 → Skill 및 추가 지시 → 참여 코드·AI 처리 동의 → AI 결과 → 다운로드·수정 또는 별도 응답 수집 동의 후 제출.

문의 분석, 자료 요약, 문안 작성 Skill을 제공합니다. 목적과 요청을 AI에 전달하므로 건수 정리에 한정되지 않습니다. 결과는 Markdown 목록·표 등으로 표시됩니다. 생성 내용은 초안이며 실제 발송이나 외부 시스템 조작은 수행하지 않습니다.

## 비용과 실패 처리

- 모델 `gpt-5-mini`, reasoning minimal, 요청당 출력 최대 3,500토큰(내부 추론 포함)
- 각 입력 최대 6,000자, 이름 120자, 전체 입력 10,000자
- 실행 버튼에서만 호출, 서버 자동 재시도 없음
- 서버 인스턴스별 동시 3요청 제한은 보조 장치이며 전체 서비스의 영구 사용 한도가 아닙니다.
- 공통 참여 코드는 참가자끼리만 공유하고, 모집 확대 시 분산 요청 제한을 추가하세요.
- OpenAI 프로젝트 사용량을 확인하고 테스트 종료 시 키 또는 참여 코드를 제거하세요. 서버 오류·취소·네트워크 단절 전 이미 시작한 AI 처리에는 비용이 발생할 수 있습니다.
- 타임아웃·빈 결과·미완성 결과·사용 한도 오류는 성공으로 표시하지 않습니다.
- AI 실패 시 규칙 기반 결과로 자동 대체하지 않습니다.

## 응답 수집

AI 실행 동의와 운영자의 응답 수집 동의는 별도입니다. OpenAI 요청에는 `store: false`를 지정합니다. 이것이 모든 제공자 로그·보존을 없앤다는 뜻은 아닙니다. 개인정보·연락처·기밀은 입력하지 않도록 안내합니다.

Vercel Storage에서 Private Blob을 만들고 프로젝트 Production에 연결한 뒤 재배포하세요. 참여자가 결과 화면에서 수집에 동의하고 응답 보내기를 누르면 `responses/<UUID>.json`을 저장합니다. 입력·실제 AI 결과·제출 시각을 포함하며 서버 서명으로 결과 변조를 검사합니다. API 키를 변경하면 이전 키로 생성한 결과의 제출은 다시 생성 후 진행해야 합니다.

공개 조회 API는 없습니다. 소유자 Vercel 대시보드에서 확인하거나 다음 명령으로 JSON을 모읍니다.

```sh
node --env-file=.env.local scripts/export-responses.mjs
```

`.env.local`에 소유자 Blob 키를 보관하세요. 키와 `exports/`는 Git에서 제외됩니다. 목적이 끝난 수집 파일은 소유자가 삭제합니다.

## 검증 범위

`npm test`는 실제 결제 호출 없이 주입한 응답으로 성공·실패·입력 검증·AI 결과 서명·Blob 저장 로직을 검사합니다. 실제 모델 품질과 배포 API는 키 등록 후 별도로 실행해 확인해야 합니다.
