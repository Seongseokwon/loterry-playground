# 실제 로또 당첨 데이터

동행복권의 회차 조회 API를 기본 15초 간격으로 호출해 `lotto-draws.json`을 생성합니다.

- 출처: `https://www.dhlottery.co.kr/lt645/selectPstLt645InfoNew.do`
- 실행 상태: `collection-state.json` (로컬 전용)
- 수집 로그: `collector.log` (로컬 전용)
- 중단 정책: HTTP 오류, 리다이렉트, JSON 형식 변경, 회차 누락 시 재시도 없이 즉시 중단

```powershell
npm run collect:draws
```

현재 회차가 바뀌면 `--target`으로 지정할 수 있습니다.

```powershell
npm run collect:draws -- --target=1237
```
