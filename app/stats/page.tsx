import type { Metadata } from "next";
import { StatsPanel } from "@/components/stats/StatsPanel";
import { getDraws } from "@/lib/repositories/draws";
import { pairStats } from "@/lib/stats";

export const metadata: Metadata = { title: "번호 통계", description: "회차를 골라 번호별 출현 빈도, 홀짝·고저·합계 분포와 1등 당첨금 추이를 확인하세요." };
export default async function StatsPage() {
  const draws = await getDraws();
  const latestDraw = draws[0];
  const oldestDraw = draws[draws.length - 1];
  return <div className="page page-narrow"><header className="page-header"><p className="eyebrow">제{oldestDraw.round}회~제{latestDraw.round}회 · {draws.length.toLocaleString("ko-KR")}회 집계</p><h1>번호 통계</h1><p className="body-color">과거 결과를 가볍고 명확하게 읽어보세요.</p></header><StatsPanel draws={draws} pairStats={pairStats(draws)} /></div>;
}
