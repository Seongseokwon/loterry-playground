import type { Metadata } from "next";
import Link from "next/link";
import { BallRow } from "@/components/lotto/BallRow";
import { Badge } from "@/components/ui/Badge";
import { formatWon } from "@/lib/format";
import { mockDraws } from "@/mocks/draws";

export const metadata: Metadata = { title: "당첨번호", description: "최근 104회 로또 당첨번호를 확인하세요." };

export default function ResultsPage() {
  return (
    <div className="page page-narrow">
      <header className="page-header"><p className="eyebrow">최근 약 2년</p><h1>당첨번호</h1><p className="body-color">제1133회부터 제1236회까지 104개 회차를 보여드려요.</p></header>
      <div className="result-list">
        {mockDraws.map((draw, index) => (
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
