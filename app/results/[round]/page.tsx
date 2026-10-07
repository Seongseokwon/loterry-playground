import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BallRow } from "@/components/lotto/BallRow";
import { ShareResultButton } from "@/components/lotto/ShareResultButton";
import { Badge } from "@/components/ui/Badge";
import { formatKoreanDate, formatWon } from "@/lib/format";
import { getDrawByRound, getDraws } from "@/lib/repositories/draws";

const INDEXABLE_ROUNDS = 30;

export const dynamicParams = true;

export async function generateStaticParams() {
  const draws = await getDraws();
  return draws.slice(0, INDEXABLE_ROUNDS).map((draw) => ({ round: String(draw.round) }));
}

export async function generateMetadata({ params }: { params: Promise<{ round: string }> }): Promise<Metadata> {
  const { round } = await params;
  const draws = await getDraws();
  const draw = draws.find((item) => item.round === Number(round));
  const isIndexable = draw ? draws.indexOf(draw) < INDEXABLE_ROUNDS : false;
  const description = draw
    ? `제${draw.round}회 로또 당첨번호 ${draw.numbers.join(", ")}와 보너스 ${draw.bonus}번, 1등 당첨 정보를 확인하세요.`
    : `제${round}회 로또 당첨번호와 1등 정보를 확인하세요.`;
  return {
    title: `제${round}회 당첨번호`,
    description,
    robots: { index: isIndexable, follow: isIndexable },
    ...(draw ? { alternates: { canonical: `/results/${draw.round}` } } : {}),
    openGraph: draw ? {
      title: `제${draw.round}회 로또 당첨번호`,
      description,
      type: "article",
      url: `/results/${draw.round}`,
      images: [{ url: `/results/${draw.round}/opengraph-image`, width: 1200, height: 630, alt: `제${draw.round}회 로또 당첨번호` }],
    } : undefined,
  };
}

export default async function ResultDetailPage({ params }: { params: Promise<{ round: string }> }) {
  const { round } = await params;
  const [draw, draws] = await Promise.all([getDrawByRound(Number(round)), getDraws()]);
  if (!draw) notFound();
  const index = draws.findIndex((item) => item.round === draw.round);
  const newer = index > 0 ? draws[index - 1] : null;
  const older = index < draws.length - 1 ? draws[index + 1] : null;
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: `제${draw.round}회 로또 당첨번호`,
    description: `제${draw.round}회 로또 당첨번호와 1등 당첨 정보를 확인하세요.`,
    datePublished: draw.date,
    dateModified: draw.date,
    mainEntityOfPage: `/results/${draw.round}`,
    author: { "@type": "Organization", name: "로또 플레이그라운드" },
  };
  return (
    <div className="page page-narrow">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <header className="page-header"><p className="eyebrow">{formatKoreanDate(draw.date)}</p><h1>제{draw.round}회 당첨번호</h1></header>
      <section className="detail-result card">
        <Badge tone="fill">추첨 완료</Badge>
        <BallRow draw={draw} size="lg" />
        <p className="body-small">앞의 6개가 당첨번호, + 뒤가 보너스 번호예요.</p>
        <ShareResultButton round={draw.round} numbers={draw.numbers} bonus={draw.bonus} />
      </section>
      <section className="section detail-money card">
        <h3>1등 당첨 정보</h3>
        <dl><div><dt>당첨자</dt><dd>{draw.firstWinners}명</dd></div><div><dt>1인당 당첨금</dt><dd>{formatWon(draw.firstWinAmount)}</dd></div><div><dt>총 판매금액</dt><dd>{formatWon(draw.totalSell)}</dd></div></dl>
      </section>
      <section className="section card card-weak">
        <h3>다음으로 해볼까요?</h3>
        <p className="body-small">이번 회차를 확인했다면 번호를 직접 넣어 보거나 다음 패턴으로 새 조합을 만들어 보세요.</p>
        <div className="status-actions">
          <Link className="product-button product-primary" href="/draw/fixed">내 번호 넣기</Link>
          <Link className="product-button product-weak" href="/draw/next-pattern">다음 패턴으로 뽑기</Link>
          <Link className="product-button product-weak" href="/archive">내 보관함 보기</Link>
        </div>
      </section>
      <div className="detail-nav">
        {older ? <Link href={`/results/${older.round}`}>← 제{older.round}회</Link> : <span />}
        {newer ? <Link href={`/results/${newer.round}`}>제{newer.round}회 →</Link> : <span />}
      </div>
      <section className="official-note card card-weak">
        <div><strong>결과는 공식 사이트에서도 확인해 주세요</strong><p className="body-small">동행복권 공개 회차 데이터를 수집해 제공합니다.</p></div>
        <a className="text-link" href="https://www.dhlottery.co.kr/" target="_blank" rel="noreferrer">공식 확인: 동행복권 ↗</a>
      </section>
      <section className="section content-guide">
        <p className="eyebrow">제{draw.round}회 결과 읽는 방법</p>
        <h2>당첨번호와 보너스 번호를 확인해 보세요</h2>
        <p>위의 앞 6개 숫자가 기본 당첨번호이고, + 뒤의 숫자가 보너스 번호입니다. 실제 당첨 여부와 지급 기준은 구매한 복권과 동행복권 공식 발표를 기준으로 확인해야 합니다.</p>
        <div className="faq-list">
          <details>
            <summary>번호를 저장하고 다음 회차에 다시 볼 수 있나요?</summary>
            <p>번호 생성이나 내 번호 조회 화면에서 저장한 조합은 이 브라우저의 보관함에서 확인할 수 있습니다. 브라우저 저장소를 삭제하기 전에는 백업 기능을 이용해 주세요.</p>
          </details>
          <details>
            <summary>이 결과로 다음 당첨번호를 예측할 수 있나요?</summary>
            <p>아니요. 과거 당첨번호와 통계는 탐색을 돕는 참고 자료일 뿐이며, 어떤 조합의 당첨을 보장하거나 확률을 높인다고 볼 수 없습니다.</p>
          </details>
        </div>
      </section>
    </div>
  );
}
