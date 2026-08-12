# TODO

기준일: 2026-08-12 · Next.js 16.2.6 / React 19.2.6
데이터: 제1~1236회 (2026-08-08 추첨분까지)
백엔드 설계: **`BACKEND-PLAN.md`** (Prisma 7 + Prisma Postgres)

**진행 상황** — A 전체 완료 / B-1~B-4 완료 / B-5 4항목 완료, 2항목은 수집기 확장 필요(E-4) / 남은 것은 C, D, E와 B-5 잔여, B-6

---

## A. 마이그레이션 잔재 정리

Next.js 전환 후 남은 것들. 코드 동작에는 영향 없지만 리포지토리를 지저분하게 만들고, 라인엔딩 문제는 앞으로의 모든 diff를 오염시킨다.

### A-1. 라인엔딩 정규화 (먼저 처리 — 다른 작업의 diff가 계속 오염됨)

현재 `git status`에 11개 파일이 수정됨으로 뜨는데, 내용 변경은 없고 전부 LF → CRLF 전환이다.

- [x] `.gitattributes` 추가 — `* text=auto eol=lf`
- [x] `git add --renormalize .` 실행 후 단독 커밋
- [x] 대상 파일: `.gitignore`, `.openai/hosting.json`, `app/layout.tsx`, `eslint.config.mjs`, `next.config.ts`, `postcss.config.mjs`, `public/*.svg`, `tsconfig.json`

### A-2. 빈 디렉토리 삭제

vinext/Cloudflare 시절 구조. 파일이 0개인데 남아 있다.

- [x] `worker/` — Cloudflare Worker 진입점 (미사용)
- [x] `db/`, `drizzle/` — Drizzle ORM 잔재. ORM은 **Prisma로 확정** (`BACKEND-PLAN.md`)
- [x] `mocks/` — MSW 잔재
- [x] `build/` — 구 빌드 출력
- [x] `app/_sites-preview/` — vinext 프리뷰 라우트

### A-3. 구 런타임 산출물·설정

- [x] `.vinext/` 삭제 — `.gitignore`에는 있으나 워크스페이스에 물리적으로 남아 있음
- [x] `.wrangler/` 삭제 (deploy/registry/state)
- [x] `dist/` 삭제 — 파일 120개, 구 빌드 결과. `.next/`가 대체함
- [x] `.openai/hosting.json` 처리 방향 결정 — Vercel(`.vercel/project.json`)로 배포처가 정해졌으면 삭제
- 참고: `dist/`, `.vinext/`, `.wrangler/`, `tsconfig.tsbuildinfo`는 `.gitignore`에 이미 등록됨 — 추적 대상은 아니고 로컬 디스크에서만 지우면 된다

### A-4. 설정 마무리

- [x] `next.config.ts`가 사실상 빈 상태 — 필요한 옵션(이미지, 헤더, redirects) 검토
- [x] `pnpm-workspace.yaml`이 `allowBuilds`만 담고 있음 — 워크스페이스 구조가 아니면 정리 대상인지 확인
- [x] `pnpm build` / `pnpm test` / `pnpm lint` 3종 통과 확인 후 A 단계 마감

---

## B. Phase 2 (v1.1) 기능 개발

기획서 §3.3.2 / §3.4 / §3.5 기준. 엔진이 이미 있는 것부터 하면 UI만 붙이면 되므로 순서를 그렇게 잡았다.

### B-1. 고급 조건 UI 노출 — 가장 저렴함

`lib/draw-engine.ts`에 판정 로직이 **이미 구현되어 있다**(39~42행). `DrawConditions` 타입에도 필드가 있다. 남은 건 `components/draw/DrawBuilder.tsx`에 아코디언을 여는 것뿐.

- [x] "고급 조건" 아코디언 컴포넌트 (기본 접힘 — 초심자 진입장벽 고려)
- [x] 홀짝 비율 — `oddCount` 0~6 세그먼트
- [x] 고저 비율 — `lowCount` 0~6 세그먼트 (기준: 1~22 / 23~45)
- [x] 합계 구간 — `sumRange` 프리셋(120~160 / 100~180) + 직접 입력(21~255)
- [x] 끝수 분산 — `maxSameTail` 1개 / 2개
- [x] 조건 충돌 시 완화 안내 — `relaxed` 배지 흐름에 신규 조건 반영
- [x] `tests/draw-engine.test.ts`에 4종 조건 케이스 추가

### B-2. 보관함 (IndexedDB)

**현재 "보관함에 저장" 버튼이 동작하지 않는다.** `DrawBuilder.tsx:155`가 `setSaved(true)`로 문구만 바꾸고 실제 저장은 하지 않는다. MVP W3 범위였는데 빠진 상태.

- [x] `lib/storage.ts` — IndexedDB 래퍼 (최대 50세트)
- [x] 저장 스키마: 번호 6개, 생성 조건 스냅샷, 라벨/메모, 대상 회차, 생성 시각
- [x] `/archive` 라우트 + 헤더·푸터 내비게이션 추가 (`components/SiteChrome.tsx`)
- [x] 저장 버튼 실제 연결 + 라벨 입력 (`아빠 번호`, `핫넘버 8/10` 형태)
- [x] 회차 확정 시 자동 등수 판정 → 보관함 배지 (`lib/rank.ts` 재사용)
- [x] 50세트 초과 시 처리 정책 (오래된 것부터 안내 후 삭제)
- [x] SSR 환경 가드 — IndexedDB는 클라이언트 전용
- [x] **동기화 대비 스키마 보강** — `SavedSet`에 `updatedAt`·`deletedAt` 추가, `DB_VERSION` 1→2, `deleteSavedSet()`을 툼스톤 마킹으로 변경 (`BACKEND-PLAN.md` §7)

### B-3. 궁합수

전용 인프라가 필요한 유일한 조건. 45C2 = 990쌍 동시출현 집계. (기존 1,035 표기는 46C2와 혼동한 산술 오류.)

- [x] `lib/stats.ts`에 `pairStats` 집계 추가 (45C2 = 990쌍)
- [x] 빌드 타임 사전 계산 여부 결정 — 1,236회 × 15쌍은 모듈 초기화 시 한 번 계산해 재사용
- [x] `/draw/pair` 프리셋 라우트 + `generateStaticParams` 등록
- [x] 기준 번호 1~2개 선택 UI, 상위 K개 파라미터
- [x] 통계 화면에 궁합수 Top 10 바 차트
- [x] **고지 카피 별도 설계** — 독립 시행인데 번호 간 상관관계가 있는 것처럼 오해될 여지가 가장 큰 조건 (기획서 §3.3.6)

### B-4. 기념일

- [x] 날짜 다중 입력 UI → 날짜의 일(day)을 1~31로 매핑, 부족분도 1~31 안에서 랜덤 채움
- [x] `/draw/birthday` 프리셋 라우트
- [x] **편향 안내 카피 필수** — ① 날짜는 1~31만 나오므로 32~45가 통째로 배제됨 ② 생일 번호는 선택자가 많아 당첨 시 당첨금 분할 확률이 높음. 안내 없이 제공하면 정직성 원칙 위반

### B-5. 통계 대시보드 확장

현재 히트맵 + 미출현 Top 10만 있음.

- [x] 홀짝 / 고저 분포 — 최근 50회 스택 바 (최근 10/50/100/전체/직접 지정 범위로 갱신)
- [x] 합계 분포 — 히스토그램 + 중앙값 마커, 구간 선택 → 해당 회차 목록
- [x] 1등 당첨금 추이 — 라인 차트 (`firstWinAmount` 데이터 이미 보유)
- [x] 번호 상세 시트에 궁합 Top 5 추가 (B-3 선행)
- [ ] 등위별 당첨금 — 수집기 확장 필요 (현재 1등만 수집). **E-4의 `DrawPrize`와 같이 움직인다**
- [ ] 1등 배출 판매점 — 공공데이터포털 「기획재정부_온라인복권 1등 당첨 판매점 현황」 개방 데이터 사용 (크롤링 아님). **E-4의 `WinningStore`와 같이 움직인다**

### B-6. QR 스캔

- [ ] **실물 용지 파싱 검증 선행** — 이게 안 되면 나머지는 무의미
- [ ] QR 페이로드 포맷 분석 (동행복권 용지 URL 구조)
- [ ] 카메라 권한 UX + 실패 시 수동 입력 폴백
- [ ] `components/check/CheckPanel.tsx`에 통합

---

## C. 착수 전 확인 필요

### C-1. 정적 생성 범위 — 기획서와 코드가 어긋남

기획서 §9는 **최근 104회만** 정적 생성 + 색인하고 나머지는 `noindex` + sitemap 제외로 설계했다. 원본 데이터 재공개 범위를 좁히려는 §7.1 대응책이다.

기존 `app/results/[round]/page.tsx:9`의 `generateStaticParams`는 **1,236개 회차를 전부 생성**했다. 현재는 최근 30회만 사전 생성하고, 이전 회차는 요청 시 생성하되 검색 색인에서 제외한다.

- [x] 최근 30회만 정적 생성·색인 + 이전 회차는 필요 시 동적 접근 + `noindex` 처리

### C-2. 없는 것들

- [ ] `app/sitemap.ts` — 미구현
- [ ] `app/robots.ts` — 미구현
- [ ] 구조화 데이터 (`Article`, `BreadcrumbList`)
- [ ] 프리셋 페이지 설명 콘텐츠 200자 이상 (SEO)

---

## D. 운영 전 (기존 유지)

- [ ] 동행복권 데이터 이용 문의 및 법률 검토 (기획서 §7.1 — 저작권법 제93조)
- [ ] 이용약관, 개인정보처리방침, 면책 문구 검토
- [ ] 데이터 주간 자동 갱신 → **E-2로 이관**
- [ ] 실데이터로 핫넘버 가중치 튜닝
- [ ] 계정 동기화 → **E-3으로 이관**
- [ ] 웹 푸시, 분석 이벤트 (v1.2)

---

## E. 백엔드 (Prisma 7 + Prisma Postgres)

상세 설계는 **`BACKEND-PLAN.md`**. 여기는 체크리스트만 둔다.

> Prisma 7은 v6와 설정 방식이 크게 다르다 — generator가 `prisma-client`로 바뀌고, `output` 지정이 필수가 되고, 드라이버 어댑터가 필수가 되고, DB URL이 `prisma.config.ts`로 이동했다. 인터넷 예제 대부분이 v6 기준이라 그대로 따라가면 깨진다. `BACKEND-PLAN.md` §2 대조표를 먼저 볼 것.

### E-1. 읽기 경로 이관 (약 1주)

- [ ] `pnpm add prisma tsx -D` / `pnpm add @prisma/client @prisma/adapter-pg dotenv`
- [ ] `npx prisma init --output ../lib/generated/prisma` → `npx create-db`로 Prisma Postgres 생성
- [ ] `.env`에 `create-db`가 돌려준 **TCP `postgres://` URL** 기록 (`prisma+postgres://` 아님, 직접 만들어 쓰지 말 것)
- [ ] `tsconfig.json` target `ES2017` → `ES2023`
- [ ] `.gitignore`에 `/lib/generated/` 추가, `eslint.config.mjs` ignore에도 추가
- [ ] `package.json` build 스크립트 → `prisma generate && next build`
- [ ] `lib/prisma.ts` 싱글턴 (`PrismaPg` 어댑터 + `globalThis` 캐싱)
- [ ] `Draw` / `NumberStat` 모델 + 첫 마이그레이션
- [ ] `prisma/seed.ts`로 기존 JSON 1,236회 이관 (**재크롤링 금지** — 기획서 §4.1 백필 1회성 원칙)
- [ ] `lib/repositories/draws.ts` — `data/draws.ts` 대체하되 **인터페이스 동일 유지**
- [ ] `/results`, `/results/[round]`, `/stats` 전환
- [ ] `data/lotto-draws.json`은 **삭제하지 말 것** — 되돌릴 수 있는 마지막 지점
- [ ] `pnpm build` / `pnpm test` / `pnpm lint` 통과 확인

> `lib/draw-engine.ts`, `lib/rank.ts`, `lib/stats.ts`는 **건드리지 않는다.** 순수 함수로 남아야 기존 테스트가 살고 `/draw`·`/check`의 DB 접근이 0으로 유지된다 (E-5).

### E-2. 수집 자동화 (3~4일) — D의 "주간 자동 갱신"을 대체

- [ ] 파싱·검증 로직을 `lib/collector/`로 추출 (`scripts/collect-lotto-draws.mjs`와 공유 — 두 벌로 갈라지면 규격 변경 시 한쪽만 고치는 사고가 난다)
- [ ] `POST /api/internal/collect` + `CRON_SECRET`, 멱등 처리
- [ ] `.github/workflows/collect.yml` — `*/10 12-14 * * 6` (KST 토 21:00~24:00). **Vercel Hobby 크론은 하루 1회 + ±1시간이라 SLA 미달**
- [ ] `revalidateTag("draws")` / `revalidateTag("stats")` 무효화 연결
- [ ] 4xx/429 시 자동 중단 + 알림 (**우회 금지** — 기획서 §7.1)
- [ ] `CollectionLog` 모델
- [ ] `/admin/draws` 수동 입력 폼 (수집 실패 백업책 — 기획서 §4.1)
- [ ] 다음 토요일 실제 추첨으로 무인 검증
- [ ] `scripts/collect-lotto-draws.mjs`는 백필 전용으로 존치

### E-3. 인증·동기화 (약 1.5주)

- [ ] B-2의 스키마 보강 선행 (`updatedAt`·`deletedAt`·툼스톤)
- [ ] Better Auth 설치 (**Auth.js 아님** — 2025년 9월 팀 합류 후 신규 프로젝트는 Better Auth 권장, 두 스키마는 호환 안 됨)
- [ ] 로그인 1종 (이메일 매직링크 또는 카카오)
- [ ] `SavedTicket` 모델 — `lib/storage.ts`의 `SavedSet`과 1:1
- [ ] 동기화 엔드포인트 3종 (`GET /api/tickets`, `POST /api/tickets/sync`, `DELETE /api/tickets/:id`)
- [ ] 병합 규칙 구현 + 테스트: 오프라인 생성 → 로그인 → 병합 / 양쪽 수정 충돌 / 삭제 후 재동기화
- [ ] **최초 로그인 시 익명 티켓 귀속** — 빠뜨리면 "로그인했더니 번호가 사라졌다"
- [ ] IndexedDB를 1차 저장소로 유지 (서버는 백업·동기화)

### E-4. v1.1 데이터

- [ ] `DrawPrize` 등위별 당첨금 — 별도 페이지 파싱 (B-5 잔여와 연계)
- [ ] `WinningStore` — 공공데이터포털 개방 데이터 (B-5 잔여와 연계)
- [ ] `PairStat` 테이블은 **만들지 않는다** — `lib/stats.ts`의 런타임 계산(990쌍)으로 충분. 빌드 시간 실측에서 문제될 때만 재검토

### E-5. 비용 방어

- [ ] 무료 티어는 월 100k 오퍼레이션 / 500MB. **TCP 직결은 요청당 1건 과금**
- [ ] `/draw`·`/check`·`/archive`는 DB 접근 0건 유지
- [ ] 첫 달 실사용량 측정 후 플랜 판단

---

## 권장 순서

A 전체와 B-1~B-4 완료. 남은 것의 순서:

1. **B-2 잔여** IndexedDB 스키마 보강 — 사용자가 늘기 전에 할수록 싸다. 30분이면 끝나고 E-3의 선행 조건이다
2. **E-1** 읽기 경로 이관 — 되돌릴 수 있는 마지막 지점
3. **E-2** 수집 자동화 — 여기까지 오면 데이터가 손 안 대고 갱신된다
4. **E-4 + B-5 잔여** 등위별 당첨금·판매점 — 테이블과 화면을 같이
5. **E-3** 인증·동기화 — 작업량이 가장 크고 없어도 서비스가 돈다. 마지막
6. **B-6** QR — 실물 용지 파싱 검증 결과에 따라 통째로 드롭될 수 있음

**C-2(sitemap·robots)는 배포 전 아무 때나.** 다른 작업과 의존이 없다.
