# 실제 로또 당첨 데이터

동행복권의 회차 조회 API를 기본 15초 간격으로 호출해 `lotto-draws.json`을 생성합니다.

- 출처: `https://www.dhlottery.co.kr/lt645/selectPstLt645InfoNew.do`
- 실행 상태: `collection-state.json` (로컬 전용)
- 수집 로그: `collector.log` (로컬 전용)
- 중단 정책: HTTP 오류, 리다이렉트, JSON 형식 변경, 회차 누락 시 재시도 없이 즉시 중단

```powershell
npm run collect:draws
```

최신 회차만 확인할 때는 다음 명령을 사용합니다. 새 회차가 없으면 파일을 변경하지 않습니다.

```powershell
pnpm collect:latest
```

현재 회차가 바뀌면 `--target`으로 지정할 수 있습니다. 현재 스냅샷은 2026-10-03 추첨분인 1244회까지 반영되어 있습니다.

```powershell
npm run collect:draws -- --target=1244
```
