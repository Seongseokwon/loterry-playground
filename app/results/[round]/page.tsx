import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BallRow } from "@/components/lotto/BallRow";
import { Badge } from "@/components/ui/Badge";
import { lottoDraws } from "@/data/draws";
import { formatKoreanDate, formatWon } from "@/lib/format";

export function generateStaticParams() { return lottoDraws.map((draw) => ({ round: String(draw.round) })); }

export async function generateMetadata({ params }: { params: Promise<{ round: string }> }): Promise<Metadata> {
  const { round } = await params;
  return { title: `제${round}회 당첨번호`, description: `제${round}회 로또 당첨번호와 1등 정보를 확인하세요.` };
}

export default async function ResultDetailPage({ params }: { params: Promise<{ round: string }> }) {
  const { round } = await params;
  const draw = lottoDraws.find((item) => item.round === Number(round));
  if (!draw) notFound();
  const index = lottoDraws.findIndex((item) => item.round === draw.round);
  const newer = index > 0 ? lottoDraws[index - 1] : null;
  const older = index < lottoDraws.length - 1 ? lottoDraws[index + 1] : null;
  return (
    <div className="page page-narrow">
      <header className="page-header"><p className="eyebrow">{formatKoreanDate(draw.date)}</p><h1>제{draw.round}회 당첨번호</h1></header>
      <section className="detail-result card">
        <Badge tone="fill">추첨 완료</Badge>
        <BallRow draw={draw} size="lg" />
        <p className="body-small">앞의 6개가 당첨번호, + 뒤가 보너스 번호예요.</p>
      </section>
      <section className="section detail-money card">
        <h3>1등 당첨 정보</h3>
        <dl><div><dt>당첨자</dt><dd>{draw.firstWinners}명</dd></div><div><dt>1인당 당첨금</dt><dd>{formatWon(draw.firstWinAmount)}</dd></div><div><dt>총 판매금액</dt><dd>{formatWon(draw.totalSell)}</dd></div></dl>
      </section>
      <div className="detail-nav">
        {older ? <Link href={`/results/${older.round}`}>← 제{older.round}회</Link> : <span />}
        {newer ? <Link href={`/results/${newer.round}`}>제{newer.round}회 →</Link> : <span />}
      </div>
      <section className="official-note card card-weak">
        <div><strong>결과는 공식 사이트에서도 확인해 주세요</strong><p className="body-small">동행복권 공개 회차 데이터를 수집해 제공합니다.</p></div>
        <a className="text-link" href="https://www.dhlottery.co.kr/" target="_blank" rel="noreferrer">공식 확인: 동행복권 ↗</a>
      </section>
    </div>
  );
}
