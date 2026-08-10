import type { Metadata } from "next";
import { StatsPanel } from "@/components/stats/StatsPanel";

export const metadata: Metadata = { title: "번호 통계", description: "최근 104회 번호별 출현 빈도와 미출현 순위를 확인하세요." };
export default function StatsPage() { return <div className="page page-narrow"><header className="page-header"><p className="eyebrow">최근 104회 집계</p><h1>번호 통계</h1><p className="body-color">과거 결과를 가볍고 명확하게 읽어보세요.</p></header><StatsPanel /></div>; }
