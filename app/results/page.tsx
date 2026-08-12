import type { Metadata } from "next";
import Link from "next/link";
import { BallRow } from "@/components/lotto/BallRow";
import { Badge } from "@/components/ui/Badge";
import { latestDraw, lottoDraws, oldestDraw } from "@/data/draws";
import { formatWon } from "@/lib/format";

export const metadata: Metadata = { title: "당첨번호", description: "제1회부터 최신 회차까지 실제 로또 당첨번호를 확인하세요." };

export default function ResultsPage() {
  return (
    <div className="page page-narrow">
      <header className="page-header"><p className="eyebrow">전체 {lottoDraws.length.toLocaleString("ko-KR")}개 회차</p><h1>당첨번호</h1><p className="body-color">제{oldestDraw.round}회부터 제{latestDraw.round}회까지 실제 추첨 결과를 보여드려요.</p></header>
      <div className="result-list">
        {lottoDraws.map((draw, index) => (
          <Link className="result-row" href={`/results/${draw.round}`} key={draw.round}>
            <div className="result-row-head"><div><strong>제{draw.round}회</strong><span>{draw.date}</span></div>{index === 0 && <Badge tone="fill">최신</Badge>}</div>
            <BallRow draw={draw} size="sm" />
            <div className="result-row-meta"><span>1등 {draw.firstWinners}명</span><span>{formatWon(draw.firstWinAmount)}</span></div>
          </Link>
        ))}
      </div>
    </div>
  );
}
