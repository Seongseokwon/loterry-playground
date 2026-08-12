# 백엔드 설계 계획

작성일: 2026-08-12
기준 코드: `732d394` (feat: add interactive statistics charts)
전제: Next.js 16.2.6 / React 19.2.6 / pnpm / Vercel 배포

---

## 0. 결정 사항

| 항목 | 선택 | 비고 |
|---|---|---|
| ORM | **Prisma 7** | 기획서 §5의 Drizzle 대체 |
| DB | **Prisma Postgres** | 기획서 §5의 Supabase 대체 |
| 서버 코드 | **Next.js Route Handlers + Server Actions** | 별도 API 서버 없음 |
| 인증 | **Better Auth** | §6 참고 |
| 스케줄러 | **GitHub Actions cron** | Vercel Hobby 제약 때문. §5 참고 |
| 로컬 저장 | IndexedDB 우선, 로그인 시 서버 동기화 | 기획서 §3.5 유지 |

### Drizzle → Prisma 전환 비용: 0

`drizzle/`, `db/` 폴더는 A-2에서 이미 삭제됐고 `package.json`에 의존성이 없습니다. 스키마도 마이그레이션 파일도 없었습니다. **전환이 아니라 신규 도입**입니다.

### 왜 Supabase 대신 Prisma Postgres인가

기획서는 "통계 집계 쿼리, Cron, 인증까지 한 스택"을 이유로 Supabase를 골랐습니다. Prisma Postgres로 바꾸면 이 중 **인증이 빠지므로** §6에서 Better Auth를 별도로 붙입니다. 대신 연결 풀링·쿼리 캐싱이 내장돼 서버리스 설정이 단순해지고, ORM과 DB가 같은 회사 제품이라 도구 체인이 맞물립니다.

무료 티어는 월 100k 오퍼레이션 / 500MB 스토리지입니다. **직접 TCP 연결은 요청 1건이 오퍼레이션 1건으로 과금**되므로, 페이지뷰마다 DB를 때리지 않는 설계(§7)가 비용에 직결됩니다.

---

## 1. 현재 코드 상태 — 백엔드가 붙을 자리

프런트가 예상보다 많이 진행돼 있어서, 백엔드는 **기존 인터페이스를 갈아끼우는 작업**에 가깝습니다.

| 영역 | 현재 | 백엔드 도입 후 |
|---|---|---|
| 데이터 진입점 | `data/draws.ts` → `lotto-draws.json` (1,236회) | `lib/repositories/draws.ts` (**인터페이스 동일 유지**) |
| 통계 | `lib/stats.ts` — 모듈 초기화 시 계산 | 상동. 입력만 DB에서 옴 |
| 궁합수 | `pairStats()` 런타임 계산 (990쌍) | 성능 문제 없으면 **그대로 둔다** |
| 추첨 엔진 | `lib/draw-engine.ts` — 순수 함수 | **건드리지 않는다** |
| 등수 판정 | `lib/rank.ts` — 순수 함수 | **건드리지 않는다** |
| 보관함 | `lib/storage.ts` — IndexedDB, DB_VERSION 1 | 1차 저장소 유지 + 동기화 필드 추가 (§6) |
| 입력 검증 | `lib/adapter.ts` `toDraw()` | 수집 파이프라인 입구로 이동 |

**원칙: 도메인 로직은 DB를 모른다.** `draw-engine` / `rank` / `stats`가 순수 함수인 덕분에 기존 테스트 8개가 그대로 살아남고, 추첨·판정이 계속 클라이언트에서 돌아 DB 비용이 0으로 유지됩니다(§7). 이 구조를 깨지 마세요.

---

## 2. Prisma 7에서 달라진 것 — 먼저 읽어야 할 부분

인터넷에 도는 Prisma 예제 대부분이 v6 기준이라 그대로 따라 하면 깨집니다.

| 항목 | v6 (옛날 방식) | v7 (지금) |
|---|---|---|
| generator | `prisma-client-js` | **`prisma-client`** |
| 클라이언트 생성 위치 | `node_modules` 자동 | **`output` 필수 지정** |
| import | `@prisma/client` | **`<output>/client`** (끝의 `/client` 필수) |
| DB URL 위치 | `schema.prisma`의 `datasource.url` | **`prisma.config.ts`** |
| 연결 방식 | 내장 Rust 엔진 | **드라이버 어댑터 필수** (`@prisma/adapter-pg`) |
| 환경변수 | 자동 로드 | **`dotenv` 명시적 로드** |
| 시딩 | `migrate dev` 시 자동 | **`prisma db seed` 수동 실행** |
| `migrate dev` / `db push` | `generate` 자동 실행 | **`generate` 별도 실행** |
| 미들웨어 `$use` | 지원 | **제거됨** → Client Extensions |

**요구 버전**: Node 20.19+ (현재 `engines` 22.13+ 충족), TypeScript 5.4+ (현재 5.9.3 충족).

**함정 3가지**

1. **`prisma+postgres://` URL을 쓰지 마세요.** Prisma Postgres는 Accelerate용 HTTP URL과 직접 TCP URL 두 가지를 줍니다. v7 신규 셋업은 **`postgres://` TCP URL + `@prisma/adapter-pg`** 조합입니다. HTTP URL을 어댑터에 넘기면 실패합니다.
2. **import 경로 끝의 `/client`를 빠뜨리면** "module not found"가 납니다. `from "@/lib/generated/prisma"`가 아니라 `from "@/lib/generated/prisma/client"`.
3. **`prisma.config.ts` 최상단에 `import "dotenv/config"`** 가 없으면 `DATABASE_URL`을 못 읽습니다.

### 이 프로젝트에서 추가로 손봐야 할 것

- `tsconfig.json`의 `"target": "ES2017"` → **`ES2023`** (v7 권장)
- 생성 클라이언트는 **`lib/generated/prisma`** 에. 공식 예제는 `app/generated/prisma`를 쓰지만 이 프로젝트는 `app/`이 라우트 디렉토리라 섞지 않는 편이 낫습니다
- `.gitignore`에 `/lib/generated/` 추가, `eslint.config.mjs`의 ignore에도 추가
- 생성물을 커밋하지 않으므로 **`"build": "prisma generate && next build"`** 로 바꿔야 배포 빌드가 깨지지 않습니다

---

## 3. 아키텍처

```
[GitHub Actions cron]  토 KST 21:00~24:00, 10분 간격
        │  POST /api/internal/collect  (Bearer CRON_SECRET)
        ▼
┌─────────────────────── Next.js (Vercel) ────────────────────────┐
│                                                                 │
│  Route Handlers          Server Components        Server Actions│
│  /api/internal/collect   /results  /stats         보관함 저장·삭제│
│  /api/tickets/*          /draw/[preset]                         │
│         │                      │                        │       │
│         └──────────────┬───────┴────────────────────────┘       │
│                        ▼                                        │
│                  lib/prisma.ts (싱글턴 + adapter-pg)             │
│                  lib/repositories/*  ← 쿼리는 여기만             │
│                  lib/draw-engine.ts · rank.ts · stats.ts         │
│                        ↑ DB를 모르는 순수 함수 (변경 없음)        │
└────────────────────────┬────────────────────────────────────────┘
                         ▼
                  Prisma Postgres (TCP)
```

---

## 4. 스키마

`prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client"
  output   = "../lib/generated/prisma"
}

datasource db {
  provider = "postgresql"
  // url 없음 — prisma.config.ts에서 설정
}

// ───────── 회차 원본 [E-1] ─────────
model Draw {
  round        Int      @id
  drawDate     DateTime @db.Date
  numbers      Int[]                  // 오름차순 정규화, 길이 6
  bonus        Int

  totalSell    BigInt?
  firstWinAmt  BigInt?
  firstAccum   BigInt?
  firstWinners Int?

  // 파생값 — 수집 시점에 계산해 저장 (조회 때 재계산 안 함)
  sumValue     Int
  oddCount     Int
  lowCount     Int                    // 1~22 개수

  fetchedAt    DateTime @default(now())

  prizes       DrawPrize[]
  stores       WinningStore[]

  @@index([drawDate])
  @@map("draws")
}

// ───────── 사전 계산 통계 [E-1] ─────────
model NumberStat {
  number         Int      @id          // 1~45
  totalCount     Int
  lastSeenRound  Int
  gap            Int
  countRecent10  Int
  countRecent50  Int
  countRecent100 Int
  updatedAt      DateTime @updatedAt

  @@map("number_stats")
}

// ───────── 수집 로그 [E-2] ─────────
model CollectionLog {
  id        BigInt   @id @default(autoincrement())
  round     Int?
  status    String                     // 'success' | 'pending' | 'failed' | 'blocked'
  message   String?
  createdAt DateTime @default(now())

  @@index([createdAt])
  @@map("collection_logs")
}

// ───────── 인증 [E-3] ─────────
// Better Auth CLI가 User/Session/Account/Verification을 생성합니다.
// 아래는 우리가 덧붙이는 관계만 표시 — 실제 필드는 CLI 출력으로 채웁니다.
model User {
  id      String        @id
  // ... Better Auth 생성 필드 ...
  tickets SavedTicket[]

  @@map("users")
}

// ───────── 보관함 [E-3] ─────────
// lib/storage.ts의 SavedSet과 1:1로 맞춥니다 (§6)
model SavedTicket {
  id              String   @id          // 클라이언트가 crypto.randomUUID()로 생성
  userId          String
  numbers         Int[]
  conditions      Json                  // DrawConditions 스냅샷
  conditionLabels String[]
  label           String
  memo            String
  targetRound     Int
  presetId        String?

  createdAt       DateTime
  updatedAt       DateTime              // 병합 시 last-write-wins 기준
  deletedAt       DateTime?             // 툼스톤 — 하드 삭제 금지 (§6)

  user            User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, targetRound])
  @@index([userId, updatedAt])
  @@map("saved_tickets")
}

// ───────── v1.1 데이터 [E-4] ─────────
model DrawPrize {
  round       Int
  rank        Int                      // 1~5
  winners     Int
  amountPer   BigInt
  amountTotal BigInt

  draw        Draw @relation(fields: [round], references: [round], onDelete: Cascade)

  @@id([round, rank])
  @@map("draw_prizes")
}

// 출처: 공공데이터포털 「기획재정부_온라인복권 1등 당첨 판매점 현황」 (개방 데이터)
model WinningStore {
  id        BigInt  @id @default(autoincrement())
  round     Int
  rank      Int
  storeName String
  method    String?                    // 자동 | 수동 | 반자동
  address   String?
  lat       Float?
  lng       Float?

  draw      Draw @relation(fields: [round], references: [round], onDelete: Cascade)

  @@index([round])
  @@map("winning_stores")
}
```

### `PairStat` 테이블은 만들지 않습니다

기획서 §4.2는 `pair_stats` 테이블을 뒀지만, 이미 `lib/stats.ts`의 `pairStats()`가 런타임에 990쌍을 계산하고 있고 화면이 정상 동작합니다. 1,236회 × 15쌍 = 약 18,500회 순회는 모듈 초기화 시 한 번이면 끝입니다.

**빌드 시간에 실측해서 문제가 될 때만 테이블로 내리세요.** 지금 옮기면 관리할 테이블만 하나 늘고 얻는 게 없습니다.

### 기획서 §4.2와 다르게 간 부분

| 기획서 | 이 설계 | 이유 |
|---|---|---|
| `n1`~`n6` 개별 컬럼 | `numbers Int[]` | 기존 `Draw` 타입(`numbers: [n,n,n,n,n,n]`)과 1:1. 변환 계층이 사라짐 |
| `sum_value` GENERATED 컬럼 | 일반 컬럼 + 수집 시 계산 | Prisma가 생성 컬럼 미지원 → raw SQL 마이그레이션 필요. 쓰기가 주 1회뿐이라 계산 비용이 무의미 |
| `saved_tickets.id UUID` | `String` (클라 생성) | 오프라인에서 먼저 만들어지므로 ID를 클라이언트가 쥐어야 병합 가능. `lib/storage.ts`가 이미 `crypto.randomUUID()`를 씀 |
| `pair_stats` 테이블 | 없음 (런타임 계산) | 위 참고 |

> `numbers Int[]`는 "특정 번호가 포함된 회차" 검색이 필요해지면 GIN 인덱스를 추가하세요. 현재 화면에는 그런 쿼리가 없습니다.

---

## 5. 초기 데이터 이관

`data/lotto-draws.json`에 1~1236회가 이미 있습니다. **다시 크롤링하지 마세요.** 기획서 §4.1의 "백필은 1회성" 원칙과 §7.1 수집 예의에 어긋납니다.

`prisma/seed.ts`:

1. `data/lotto-draws.json` 읽기
2. 각 항목을 `lib/adapter.ts`의 `toDraw()`로 검증
3. `sumValue` / `oddCount` / `lowCount` 계산
4. `createMany({ skipDuplicates: true })` — 1,236행이면 배치 한 번
5. `number_stats` 재계산 후 upsert

`prisma.config.ts`의 `migrations.seed`에 `tsx prisma/seed.ts`를 등록하고, **v7은 자동 실행이 없으므로** `pnpm dlx prisma db seed`를 명시적으로 돌립니다.

**검증**: 시딩 후 `tests/data.test.ts`와 같은 단언(행 수, 최신 회차, 번호 정렬, 중복 없음)을 DB 대상으로 한 번 더 돌려 JSON과 DB가 일치하는지 확인합니다.

---

## 6. 수집 파이프라인

### Vercel Hobby 제약 — 기획서 스케줄을 그대로 못 씁니다

기획서 §4.1은 **토요일 21:05 / 21:20 / 21:40 / 22:00 네 번 재시도**를 전제합니다. 그런데 Vercel Hobby 플랜은 **크론이 하루 1회로 제한**되고, 그마저도 지정 시각부터 한 시간 안에 언제든 실행되는 방식이라 정시성이 없습니다.

| 안 | 비용 | 정시성 | 판단 |
|---|---|---|---|
| **GitHub Actions cron** | 무료 | 수 분 지연 가능하나 10분 간격 반복으로 흡수 | **권장** |
| Vercel Pro | $20/월 | 분 단위 스케줄 | 트래픽이 붙은 뒤 검토 |
| Vercel Hobby 그대로 | 무료 | 토 1회, ±1시간 | SLA(추첨 후 15분 내 반영) 미달 |

리포지토리가 이미 GitHub(`Seongseokwon/loterry-playground`)에 있고 `.github/`가 비어 있으니, 워크플로 파일 하나만 추가하면 됩니다.

`.github/workflows/collect.yml` — `cron: "*/10 12-14 * * 6"` (UTC 12:00~14:59 = KST 토 21:00~23:59). 각 실행이 `POST /api/internal/collect`를 호출하고, 이미 수집됐으면 핸들러가 즉시 no-op으로 끝나므로 반복 호출이 안전합니다.

### 핸들러 흐름 — `app/api/internal/collect/route.ts`

```
1. Authorization: Bearer ${CRON_SECRET} 검증 → 실패 시 401
2. DB 최신 회차 조회 → 목표 회차 = 최신 + 1
3. 이미 존재하면 { skipped: true } 반환 (멱등)
4. fetch(동행복권) — UA에 서비스명·연락처 명시
5. returnValue === "success" 확인 → 아니면 아직 미추첨, 202로 종료
6. toDraw()로 검증 → 파생값 계산 → draws upsert
7. number_stats 전량 재계산 (45행, 1,237회차 스캔 — 수십 ms)
8. revalidateTag("draws") / revalidateTag("stats")
9. 결과를 CollectionLog에 기록
```

**기획서 §4.1 수집 원칙을 코드로 강제할 것**

- 4xx/429 응답 감지 시 **재시도하지 말고 즉시 중단** + 운영자 알림. 우회 금지
- 연속 3회 실패 시 알림
- 수집 실패 대비 관리자 수동 입력 폼 (`/admin/draws`, 번호 7개 입력) — §4.1이 지정한 백업책이고 구현 비용이 낮습니다

### `scripts/collect-lotto-draws.mjs`는 어떻게 되나

**백필 전용으로 남깁니다.** 정기 수집은 Route Handler로 옮깁니다. 파싱 로직이 두 벌로 갈라지면 동행복권 규격이 바뀔 때 한쪽만 고치는 사고가 나므로, 파싱·검증부를 `lib/collector/`로 추출해 스크립트와 핸들러가 공유하게 하세요.

---

## 7. 인증과 동기화

### 라이브러리: Better Auth

2025년 9월 Auth.js 팀이 Better Auth에 합류했고, Auth.js는 보안 패치만 유지되는 상태입니다. **신규 프로젝트는 Better Auth 권장**입니다. Prisma가 Prisma Postgres + Better Auth + Next.js 조합의 공식 가이드를 제공합니다.

> 주의: Auth.js의 `@auth/prisma-adapter` 스키마와 Better Auth 스키마는 **호환되지 않습니다.** 둘을 섞은 예제를 따라가지 마세요.

### 로컬 우선을 깨지 않는 것이 핵심

기획서 §3.5는 "저장은 기본 로컬(IndexedDB), 로그인은 기기 간 동기화를 원할 때만"입니다. 이 순서를 뒤집으면 안 됩니다.

```
비로그인:  IndexedDB만. 서버 요청 0건. 지금 그대로 동작
로그인:    IndexedDB가 여전히 1차 저장소. 서버는 백업·동기화 대상
```

### `lib/storage.ts`에 필요한 변경

현재 `SavedSet`에는 동기화에 필요한 두 필드가 없습니다.

```ts
export interface SavedSet {
  id: string;              // ✅ 이미 crypto.randomUUID() — 그대로 사용
  numbers: SavedSetNumbers;
  conditions: DrawConditions;
  conditionLabels: string[];
  label: string;
  memo: string;
  targetRound: number;
  createdAt: string;
  presetId?: string;
  updatedAt: string;       // ➕ 추가 — 병합 시 last-write-wins 기준
  deletedAt?: string;      // ➕ 추가 — 툼스톤
}
```

- `DB_VERSION`을 **1 → 2**로 올리고 `onupgradeneeded`에서 기존 레코드에 `updatedAt = createdAt`을 채웁니다
- `deleteSavedSet()`을 **하드 삭제에서 툼스톤 마킹으로** 바꿉니다. 지금처럼 지우면 다른 기기에서 되살아납니다
- `getSavedSets()`는 `deletedAt`이 있는 항목을 걸러서 반환합니다
- `ARCHIVE_LIMIT` 50 카운트에서도 툼스톤은 제외합니다

이 변경은 **E-3 착수 시점이 아니라 그 전에** 해두는 편이 낫습니다. 스키마 마이그레이션은 사용자가 늘기 전에 할수록 싸집니다.

### 병합 규칙

1. 티켓 ID는 **클라이언트가** 만든다 → 오프라인 생성분도 충돌 없이 올라감
2. 같은 ID가 양쪽에 있으면 `updatedAt`이 큰 쪽이 이긴다 (last-write-wins)
3. 삭제는 툼스톤으로 전파한다
4. 최초 로그인 시 로컬 익명 티켓을 전부 그 계정으로 귀속시킨다 — **"로그인했더니 번호가 사라졌다"가 가장 흔한 사고다**
5. 50세트 상한은 계정 기준으로 다시 센다

### 엔드포인트

| 메서드 | 경로 | 용도 |
|---|---|---|
| `GET` | `/api/tickets?since=<ISO>` | 델타 풀 (툼스톤 포함) |
| `POST` | `/api/tickets/sync` | 배치 업서트 + 병합 결과 반환 |
| `DELETE` | `/api/tickets/:id` | 툼스톤 마킹 |

단건 저장·삭제는 Server Actions로, 배치 동기화는 Route Handler로 두는 편이 낫습니다. 동기화는 재시도·오프라인 큐가 필요해 명시적 HTTP가 다루기 쉽습니다.

### 로그인 수단

이메일 매직링크 또는 소셜 1종(카카오)이면 충분합니다. 비밀번호 방식은 재설정 플로우까지 딸려와 이 규모에 과합니다.

---

## 8. 캐싱 — 무료 티어를 지키는 핵심

**페이지뷰마다 DB를 때리면 안 됩니다.** 무료 티어는 월 100k 오퍼레이션이고 TCP 직결은 요청당 1건으로 셉니다. 토요일 밤 스파이크에 그대로 노출하면 순식간에 소진됩니다.

| 화면 | 전략 | DB 접근 |
|---|---|---|
| `/results/[round]` | SSG + `revalidateTag("draws")` | 빌드/무효화 시 1회 |
| `/results` 목록 | SSG, 주 1회 무효화 | 주 1회 |
| `/stats` | SSG, 집계 결과만 | 주 1회 |
| `/draw/*` | 정적 셸 + 클라이언트 추첨 | **0건** |
| `/check` | 클라이언트 판정 (`lib/rank.ts`) | **0건** |
| `/archive` | IndexedDB. 로그인 시에만 동기화 | 로그인 사용자 한정 |

추첨·판정·통계가 순수 함수로 도는 현재 구조가 그대로 비용 방어책입니다. §1의 "도메인 로직은 DB를 모른다" 원칙을 지켜야 하는 실질적 이유입니다.

---

## 9. 실행 순서

체크리스트는 `TODO.md`의 E 섹션에 있습니다. 단계 요약만 적습니다.

| 단계 | 내용 | 예상 |
|---|---|---|
| **E-1** | 읽기 경로 이관 — Prisma 셋업, 스키마, 시딩, `/results`·`/stats` 전환 | 약 1주 |
| **E-2** | 수집 자동화 — Route Handler + GitHub Actions + 관리자 폼 | 3~4일 |
| **E-3** | 인증·동기화 — Better Auth, `SavedTicket`, 병합 | 약 1.5주 |
| **E-4** | v1.1 데이터 — `DrawPrize`, `WinningStore` | 미정 |

**E-1이 끝나는 지점이 되돌릴 수 있는 마지막 지점입니다.** `data/lotto-draws.json`을 지우지 마세요. DB가 비어도 JSON으로 되돌아갈 수 있어야 합니다.

**C-1(정적 생성 범위 최근 30회)을 E-1 전에 결정하세요.** `/results/[round]`는 최근 30회만 정적으로 생성하고 이전 회차는 요청 시 생성하되 `noindex` 처리합니다.

---

## 10. 위험 요소

| 위험 | 영향 | 대응 |
|---|---|---|
| 무료 티어 오퍼레이션 초과 | 서비스 중단 | §8 캐싱 전략 준수. 첫 달 사용량 실측 후 판단 |
| 동행복권 응답 규격 변경 | 수집 중단 | `toDraw()` 검증 실패를 알림으로. 관리자 수동 입력 폼이 백업 |
| 수집 차단 (4xx/429) | 데이터 정지 | 자동 중단 + 알림. **우회 시도 금지** (기획서 §7.1) |
| 동기화 병합 버그로 번호 유실 | 신뢰 직결 | 툼스톤 + LWW + 병합 테스트. 로컬을 1차 저장소로 유지 |
| Prisma v6 예제 따라가다 깨짐 | 개발 지연 | §2 대조표 기준으로 확인 |
| Vercel 크론 정시성 | SLA 미달 | GitHub Actions로 우회 (§6) |
| IndexedDB 스키마 변경 시점 지연 | 마이그레이션 비용 증가 | `updatedAt`/`deletedAt`을 E-3 전에 미리 추가 (§7) |

---

## 11. 참고

- [Upgrade to Prisma ORM v7](https://www.prisma.io/docs/guides/upgrade-prisma-orm/v7)
- [Next.js + Prisma 공식 셋업 가이드 (v7)](https://www.prisma.io/docs/ai/prompts/nextjs)
- [Prisma Postgres 연결 방식](https://www.prisma.io/docs/postgres/database/connecting-to-your-database)
- [Prisma 요금제](https://www.prisma.io/pricing)
- [Prisma Postgres + Better Auth + Next.js](https://www.prisma.io/docs/guides/authentication/better-auth/nextjs)
- [Vercel 크론 사용량과 제한](https://vercel.com/docs/cron-jobs/usage-and-pricing)
