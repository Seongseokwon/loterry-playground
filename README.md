# 로또 플레이그라운드 · Phase 1

외부 API 없이 고정 시드 Mock 104회차, 번호 통계, 조건 조립형 추첨 엔진, 등수 판정을 제공하는 Next.js App Router 프론트엔드입니다.

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
- `lib/`: 도메인 타입, 어댑터, CSPRNG, 추첨 엔진, 등수 판정, 통계 집계
- `mocks/`: 고정 시드 104회차 생성기와 Mock 진입점
- `styles/`: 디자인 토큰과 화면 스타일
- `tests/`: Vitest 단위 테스트

모든 화면은 `Draw` 도메인 타입만 사용합니다. 실제 API 연동 시 `lib/adapter.ts`의 `toDraw()`만 교체하면 됩니다.

Phase 1에서는 외부 네트워크 호출, 로그인, DB, 브라우저 영속 저장을 사용하지 않습니다. 보관 동작은 현재 화면의 React 상태에서만 유지됩니다.
