"use client";

import { useMemo, useState } from "react";
import { LottoBall } from "@/components/lotto/LottoBall";
import { ProductButton } from "@/components/ui/Button";
import { lottoDraws, lottoPairStats } from "@/data/draws";
import { drawNumbers } from "@/lib/draw-engine";
import { aggregateNumberStats } from "@/lib/stats";

export function TicketFreshPick({ games }: { games: number[][] }) {
  const [recommendations, setRecommendations] = useState<number[][]>([]);
  const excluded = useMemo(() => [...new Set(games.flat())].sort((left, right) => left - right), [games]);
  const generate = () => {
    const result = drawNumbers({
      conditions: {
        excluded,
        hot: { window: 50, weight: "high" },
        cold: { poolSize: 20 },
        pair: { base: [], topK: 30, window: 100 },
        antiCrowd: true,
        sumRange: [120, 180],
        maxSameTail: 2,
      },
      filters: { noConsecutive3: true, noPastJackpot: true, noSameTail3: true },
      games: 5,
      presetId: "ticket-fresh-pick",
    }, {
      stats: aggregateNumberStats(lottoDraws),
      pairStats: lottoPairStats,
      latestDraw: lottoDraws[0],
      pastDraws: lottoDraws,
    });
    setRecommendations(result.games);
  };

  return (
    <section className="ticket-fresh-pick card">
      <div className="ticket-fresh-pick-head">
        <div>
          <p className="eyebrow">용지 비중복 추천</p>
          <h2>아직 용지에 없는 번호로 만들기</h2>
        </div>
        <span className="badge badge-weak">{games.length}게임 분석</span>
      </div>
      <p className="body-color">읽어온 용지에 한 번이라도 나온 번호 <strong>{excluded.length}개</strong>를 모두 제외하고, 최근 50회 흐름·미출현 번호·동반 출현·반전 픽 필터를 조합해 새 번호를 만들어요.</p>
      <p className="body-small">당첨 확률을 예측하거나 높이는 기능은 아니며, 기존 구매 조합과 겹치지 않게 고르는 재미를 위한 기능이에요.</p>
      <div className="ticket-fresh-excluded" aria-label="용지에서 제외한 번호">{excluded.map((number) => <span key={number}>{number}</span>)}</div>
      <ProductButton size="large" onClick={generate}>용지 밖 새 조합 5게임 만들기</ProductButton>
      {recommendations.length > 0 && <div className="ticket-fresh-results" aria-live="polite">
        <p className="body-small">새로 만든 조합 — 용지의 모든 번호와 겹치지 않아요</p>
        {recommendations.map((game, index) => <div className="ticket-fresh-game" key={game.join(",")}><strong>{String.fromCharCode(65 + index)}게임</strong><div className="numbers">{game.map((number) => <LottoBall key={number} number={number} size="sm" />)}</div></div>)}
      </div>}
    </section>
  );
}
