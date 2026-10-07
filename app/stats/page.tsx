import type { Metadata } from "next";
import { StatsPanel } from "@/components/stats/StatsPanel";
import { getDraws } from "@/lib/repositories/draws";
import { pairStats } from "@/lib/stats";

export const metadata: Metadata = { title: "번호 통계", description: "회차를 골라 번호별 출현 빈도, 홀짝·고저·합계 분포와 1등 당첨금 추이를 확인하세요." };
export default async function StatsPage() {
  const draws = await getDraws();
  const latestDraw = draws[0];
  const oldestDraw = draws[draws.length - 1];
  return <div className="page page-narrow"><header className="page-header"><p className="eyebrow">제{oldestDraw.round}회~제{latestDraw.round}회 · {draws.length.toLocaleString("ko-KR")}회 집계</p><h1>로또 번호 통계</h1><p className="body-color">번호별 출현 빈도와 최근 흐름을 확인해 보세요. 통계는 과거 결과를 요약한 자료이며 다음 당첨을 예측하지 않습니다.</p></header><StatsPanel draws={draws} pairStats={pairStats(draws)} /><section className="section content-guide"><h2>통계를 활용하는 방법</h2><p>최근 출현 빈도, 미출현 기간, 홀짝·고저·합계 분포를 함께 살펴볼 수 있습니다. 특정 번호가 오래 나오지 않았거나 자주 나왔다는 사실만으로 다음 회차의 당첨 가능성이 달라지는 것은 아니므로, 원하는 조건을 정리하는 참고 자료로 활용해 주세요.</p></section></div>;
}
