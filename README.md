# 로또 플레이그라운드

동행복권 공개 회차 데이터 1~1236회, 번호 통계, 조건 조립형 추첨 엔진, 등수 판정을 제공하는 Next.js App Router 프론트엔드입니다.

## 실행

```bash
pnpm install
pnpm dev
```

검증은 다음 명령으로 실행합니다.

```bash
pnpm test
pnpm build
```

## 구조

- `app/`: 홈, 당첨번호 목록·상세, 추첨, 통계, 내 번호 조회
- `components/ui/`: Button, Badge, TextField, Agreement
- `components/lotto/`: LottoBall, NumberGrid, ConditionChip, PresetCard, StatHeatmap, ResultSheet
- `data/`: 실제 당첨 데이터와 애플리케이션 데이터 진입점
- `lib/`: 도메인 타입, 어댑터, CSPRNG, 추첨 엔진, 등수 판정, 통계 집계
- `scripts/`: 동행복권 데이터 수집기
- `styles/`: 디자인 토큰과 화면 스타일
- `tests/`: Vitest 단위 테스트

모든 화면은 `Draw` 도메인 타입과 `data/draws.ts` 진입점을 사용합니다.

최신 회차를 추가 수집할 때는 `collect-draws.cmd` 또는 `pnpm collect:draws -- --target=<회차>`를 실행합니다.
