# 로또 플레이그라운드

동행복권 공개 회차 데이터 1~1244회, 번호 통계, 조건 조립형 추첨 엔진, 등수 판정과 저장 번호 분석을 제공하는 Next.js App Router 프론트엔드입니다.

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

수익화 우선순위와 단계별 작업·완료 기준은 [수익화 로드맵 및 작업 인수인계](./MONETIZATION-ROADMAP.md)를 참고하세요. 다른 모델이나 개발자가 작업을 이어갈 때 이 문서에서 현재 구현과 계획을 먼저 구분해 확인합니다.

- `app/`: 홈, 당첨번호 목록·상세, 추첨, 통계, 내 번호 조회, 번호 보관함·분석
- `components/ui/`: Button, Badge, TextField, Agreement
- `components/lotto/`: LottoBall, NumberGrid, ConditionChip, PresetCard, StatHeatmap, ResultSheet
- `data/`: 실제 당첨 데이터와 애플리케이션 데이터 진입점
- `lib/`: 도메인 타입, 어댑터, CSPRNG, 추첨 엔진, 등수 판정, 통계 집계, 저장 번호 분석
- `scripts/`: 동행복권 데이터 수집기
- `styles/`: 디자인 토큰과 화면 스타일
- `tests/`: Vitest 단위 테스트

모든 화면은 `Draw` 도메인 타입과 `data/draws.ts` 진입점을 사용합니다.

최신 회차는 GitHub Actions가 토요일 추첨 시간대에 자동 확인하고, 새 데이터가 있으면 `data/lotto-draws.json`을 커밋해 배포를 갱신합니다. 수동 실행은 Actions의 `Collect lotto draws` 워크플로에서 `Run workflow`를 선택하거나 로컬에서 `pnpm collect:latest`를 실행하면 됩니다. 전체 백필은 `collect-draws.cmd` 또는 `pnpm collect:draws -- --target=<회차>`를 사용합니다.

프로젝트 데이터를 건드리지 않고 최신 확정 회차만 확인하려면 `pnpm preview:latest` 또는 `node scripts/preview-latest-draw.mjs`를 실행합니다. 이 명령은 동행복권 API를 읽기만 하고 JSON·상태 파일을 수정하지 않습니다. 특정 회차를 정확히 확인하려면 `pnpm preview:latest -- --round=1244`처럼 `--round=<회차>`를 추가합니다. 해당 회차가 아직 발표되지 않았으면 최신 회차로 대체하지 않고 오류를 표시합니다.
