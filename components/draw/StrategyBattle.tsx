"use client";

import { useMemo, useState } from "react";
import { LottoBall } from "@/components/lotto/LottoBall";
import { ProductButton } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { lottoDraws } from "@/data/draws";
import { drawNumbers } from "@/lib/draw-engine";
import { generationBucket, trackEvent } from "@/lib/analytics";
import { aggregateNumberStats } from "@/lib/stats";
import { saveSavedSet, type SavedSetNumbers } from "@/lib/storage";
import type { DrawConditions, DrawResult } from "@/lib/types";

type Strategy = {
  id: string;
  label: string;
  description: string;
  conditions: DrawConditions;
};

type BattleResult = Strategy & { result: DrawResult | null };

const strategies: Strategy[] = [
  { id: "random", label: "완전 랜덤", description: "조건 없이 여섯 번호를 골라요.", conditions: {} },
  { id: "hot", label: "핫넘버", description: "최근 자주 나온 번호를 참고해요.", conditions: { hot: { window: 30, weight: "mid" } } },
  { id: "cold", label: "미출현", description: "오래 쉬고 있는 번호를 참고해요.", conditions: { cold: { poolSize: 20 } } },
  { id: "anti-crowd", label: "반전 픽", description: "덜 뻔한 조합을 시도해요.", conditions: { antiCrowd: true } },
];

const baseFilters = { noConsecutive3: false, noPastJackpot: true, noSameTail3: false };

export function StrategyBattle() {
  const [results, setResults] = useState<BattleResult[]>([]);
  const [generating, setGenerating] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const stats = useMemo(() => aggregateNumberStats(lottoDraws), []);
  const targetRound = lottoDraws[0].round + 1;

  function generateBattle() {
    if (generating) return;
    setGenerating(true);
    setError("");
    setSavedId(null);
    trackEvent("draw_started", { preset: "strategy-battle", mode: "comparison", generationCount: generationBucket(strategies.length) });

    try {
      const nextResults = strategies.map((strategy) => {
        const result = drawNumbers({ conditions: strategy.conditions, filters: baseFilters, games: 1, presetId: strategy.id }, { stats, latestDraw: lottoDraws[0], pastDraws: lottoDraws });
        return { ...strategy, result: result.games.length ? result : null };
      });
      const generatedGames = nextResults.filter((item) => item.result?.games.length).length;
      setResults(nextResults);
      trackEvent("draw_completed", { preset: "strategy-battle", mode: "comparison", generatedGames, successfulIterations: generatedGames, failedIterations: strategies.length - generatedGames });
    } catch {
      setError("전략별 조합을 만들지 못했어요. 잠시 후 다시 시도해 주세요.");
      trackEvent("draw_failed", { preset: "strategy-battle", mode: "comparison", reason: "battle_error" });
    } finally {
      setGenerating(false);
    }
  }

  async function saveStrategy(item: BattleResult) {
    const game = item.result?.games[0];
    if (!game || savingId) return;
    setSavingId(item.id);
    try {
      const outcome = await saveSavedSet({
        numbers: [...game].sort((left, right) => left - right) as SavedSetNumbers,
        conditions: item.conditions,
        conditionLabels: ["전략 대결", item.label],
        label: `${item.label} 전략`,
        memo: "전략 대결에서 선택한 번호",
        targetRound,
        presetId: "strategy-battle",
      });
      if (outcome.status !== "saved") {
        setError("보관함 저장 한도에 도달했어요. 기존 조합을 정리한 뒤 다시 시도해 주세요.");
        return;
      }
      setSavedId(item.id);
      trackEvent("set_saved", { source: "strategy-battle", strategy: item.id, targetRound });
    } catch {
      setError("보관함에 저장하지 못했어요. 보관함 상태를 확인해 주세요.");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="strategy-battle">
      <header className="page-header">
        <p className="eyebrow">4가지 방식을 한 번에 비교</p>
        <h1>전략 대결</h1>
        <p className="body-color">같은 회차를 기준으로 서로 다른 방식의 번호를 만들어 보고, 마음에 드는 조합만 골라 보관하세요.</p>
      </header>
      <section className="card card-weak strategy-battle-intro">
        <p>각 방식은 과거 데이터나 번호 분포를 다르게 참고할 뿐이며, 어떤 방식도 당첨을 예측하거나 보장하지 않습니다.</p>
        <ProductButton size="large" loading={generating} onClick={generateBattle}>4가지 전략으로 뽑기</ProductButton>
      </section>
      {error && <p className="archive-error" role="alert">{error}</p>}
      {results.length > 0 && <div className="strategy-battle-grid" aria-live="polite">
        {results.map((item) => {
          const game = item.result?.games[0];
          return <article className="card strategy-card" key={item.id}>
            <div className="strategy-card-head"><div><Badge tone={item.id === "anti-crowd" ? "fill" : "weak"}>{item.label}</Badge><h2>{item.label}</h2></div><span className="body-small">제{targetRound}회 참고</span></div>
            <p className="body-small">{item.description}</p>
            {game ? <div className="numbers strategy-numbers">{game.map((number, index) => <LottoBall key={number} number={number} size="sm" delay={index * 70} />)}</div> : <p className="body-small danger">현재 조건에서는 조합을 만들지 못했어요.</p>}
            {game && <ProductButton size="small" tone="weak" loading={savingId === item.id} disabled={savedId === item.id} onClick={() => void saveStrategy(item)}>{savedId === item.id ? "보관함에 저장했어요" : "이 조합 저장"}</ProductButton>}
          </article>;
        })}
      </div>}
      <section className="content-guide">
        <h2>전략별 차이</h2>
        <p>완전 랜덤은 특정 통계를 사용하지 않고, 핫넘버와 미출현은 과거 출현 흐름을 참고합니다. 반전 픽은 생일 범위와 규칙적인 모양에만 몰리지 않는 조합을 만드는 방식입니다. 과거 추첨은 독립적이므로 결과를 예측하는 도구로 사용할 수는 없습니다.</p>
      </section>
    </div>
  );
}
