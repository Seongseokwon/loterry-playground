import type { Metadata } from "next";
import { StatsPanel } from "@/components/stats/StatsPanel";
import { latestDraw, lottoDraws, oldestDraw } from "@/data/draws";

export const metadata: Metadata = { title: "번호 통계", description: "전체 로또 회차의 번호별 출현 빈도와 미출현 순위를 확인하세요." };
export default function StatsPage() { return <div className="page page-narrow"><header className="page-header"><p className="eyebrow">제{oldestDraw.round}회~제{latestDraw.round}회 · {lottoDraws.length.toLocaleString("ko-KR")}회 집계</p><h1>번호 통계</h1><p className="body-color">과거 결과를 가볍고 명확하게 읽어보세요.</p></header><StatsPanel /></div>; }
