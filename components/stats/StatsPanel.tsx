"use client";

import Link from "next/link";
import { useMemo, useState, type CSSProperties } from "react";
import { StatHeatmap } from "@/components/lotto/StatHeatmap";
import { ResultSheet } from "@/components/lotto/ResultSheet";
import { LottoBall } from "@/components/lotto/LottoBall";
import { Badge } from "@/components/ui/Badge";
import { lottoDraws, lottoPairStats } from "@/data/draws";
import { aggregateNumberStats, drawSum, lowHighDistribution, median, oddEvenDistribution, SUM_RANGES } from "@/lib/stats";
import type { Draw, PairStat } from "@/lib/types";

type RangePreset = "10" | "50" | "100" | "all" | "custom";

const latestRound = lottoDraws[0].round;
const oldestRound = lottoDraws[lottoDraws.length - 1].round;

function formatWon(amount: number) {
  return `${Math.round(amount / 10_000).toLocaleString("ko-KR")}만원`;
}

function DistributionCard({ title, description, firstLabel, secondLabel, items }: {
  title: string;
  description: string;
  firstLabel: string;
  secondLabel: string;
  items: { label: string; count: number }[];
}) {
  const maxCount = Math.max(...items.map((item) => item.count), 1);
  const total = items.reduce((sum, item) => sum + item.count, 0);
  return (
    <section className="card distribution-card">
      <div className="section-head"><div><h3>{title}</h3><p className="body-small">{description}</p></div></div>
      <div className="distribution-list">
        {items.map((item) => {
          const firstCount = Number(item.label.split(":")[0]);
          return (
            <div className="distribution-row" key={item.label}>
              <span className="distribution-label">{item.label}</span>
              <span className="distribution-track" style={{ "--distribution-height": `${Math.max(10, (item.count / maxCount) * 100)}%` } as CSSProperties}>
                <span className="distribution-segment distribution-first" style={{ width: `${(firstCount / 6) * 100}%` }}><span className="sr-only">{firstLabel} {firstCount}개</span></span>
                <span className="distribution-segment distribution-second" style={{ width: `${((6 - firstCount) / 6) * 100}%` }}><span className="sr-only">{secondLabel} {6 - firstCount}개</span></span>
              </span>
              <strong>{item.count}회</strong>
            </div>
          );
        })}
      </div>
      <p className="body-small distribution-legend"><span><i className="legend-dot legend-first" />{firstLabel}</span><span><i className="legend-dot legend-second" />{secondLabel}</span><span>합계 {total}회</span></p>
    </section>
  );
}

function SumDistribution({ draws }: { draws: Draw[] }) {
  const [selectedRange, setSelectedRange] = useState<string | null>(null);
  const sums = draws.map(drawSum);
  const middle = median(sums);
  const buckets = SUM_RANGES.map((range) => ({ ...range, count: sums.filter((sum) => sum >= range.min && sum <= range.max).length }));
  const maxCount = Math.max(...buckets.map((bucket) => bucket.count), 1);
  const visibleDraws = selectedRange ? draws.filter((draw) => {
    const range = SUM_RANGES.find((item) => item.label === selectedRange);
    const sum = drawSum(draw);
    return range ? sum >= range.min && sum <= range.max : true;
  }) : [];
  const medianPosition = Math.min(100, Math.max(0, ((middle - 21) / (255 - 21)) * 100));
  return (
    <section className="section card sum-distribution-card">
      <div className="section-head"><div><h3>합계 분포</h3><p className="body-small">선택한 회차의 여섯 번호 합계 · 중앙값 {middle || "-"}</p></div></div>
      <div className="sum-chart" aria-label={`합계 분포 히스토그램, 중앙값 ${middle}`}>
        <span className="sum-median" style={{ left: `${medianPosition}%` }}><span>중앙값 {middle || "-"}</span></span>
        {buckets.map((bucket) => (
          <button type="button" className={`sum-bucket ${selectedRange === bucket.label ? "sum-bucket-active" : ""}`} key={bucket.label} aria-pressed={selectedRange === bucket.label} onClick={() => setSelectedRange((current) => current === bucket.label ? null : bucket.label)}>
            <span className="sum-bucket-bar" style={{ height: `${Math.max(8, (bucket.count / maxCount) * 100)}%` }}><span>{bucket.count}</span></span>
            <small>{bucket.label}</small>
          </button>
        ))}
      </div>
      <p className="body-small">구간을 누르면 해당 회차 목록을 볼 수 있어요.</p>
      {selectedRange && (
        <div className="sum-round-list">
          <div className="section-head"><h4>합계 {selectedRange} 회차</h4><span className="body-small">{visibleDraws.length}회</span></div>
          {visibleDraws.map((draw) => <Link href={`/results/${draw.round}`} className="sum-round-row" key={draw.round}><span>제{draw.round}회 · {draw.date}</span><strong>{drawSum(draw)}점</strong></Link>)}
        </div>
      )}
    </section>
  );
}

function FirstPrizeTrend({ draws }: { draws: Draw[] }) {
  const trendDraws = [...draws].filter((draw) => typeof draw.firstWinAmount === "number").sort((a, b) => a.round - b.round);
  const amounts = trendDraws.map((draw) => draw.firstWinAmount as number);
  const min = Math.min(...amounts);
  const max = Math.max(...amounts, 1);
  const points = trendDraws.map((draw, index) => {
    const x = trendDraws.length <= 1 ? 50 : (index / (trendDraws.length - 1)) * 100;
    const y = 90 - (((draw.firstWinAmount as number) - min) / Math.max(max - min, 1)) * 75;
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  }).join(" ");
  return (
    <section className="section card prize-trend-card">
      <div className="section-head"><div><h3>1등 당첨금 추이</h3><p className="body-small">선택한 회차의 1등 1인당 당첨금 · 오래된 회차에서 최신 회차 순</p></div></div>
      {trendDraws.length > 0 ? (
        <>
          <div className="prize-chart" role="img" aria-label={`1등 당첨금 추이, 최저 ${formatWon(min)}, 최고 ${formatWon(max)}`}>
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><polyline points={points} fill="none" vectorEffect="non-scaling-stroke" /></svg>
          </div>
          <div className="prize-chart-labels"><span>최저 {formatWon(min)}</span><span>최고 {formatWon(max)}</span></div>
          <p className="body-small">제{trendDraws[0].round}회 {formatWon(trendDraws[0].firstWinAmount as number)} · 제{trendDraws[trendDraws.length - 1].round}회 {formatWon(trendDraws[trendDraws.length - 1].firstWinAmount as number)}</p>
        </>
      ) : <p className="body-small">선택한 회차에는 당첨금 데이터가 없어요.</p>}
    </section>
  );
}

export function StatsPanel() {
  const [rangePreset, setRangePreset] = useState<RangePreset>("50");
  const [customStart, setCustomStart] = useState(latestRound - 49);
  const [customEnd, setCustomEnd] = useState(latestRound);
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null);
  const selectedDraws = useMemo(() => {
    if (rangePreset === "all") return lottoDraws;
    const count = rangePreset === "custom" ? null : Number(rangePreset);
    if (count) return lottoDraws.slice(0, count);
    const start = Math.max(oldestRound, Math.min(customStart, customEnd));
    const end = Math.min(latestRound, Math.max(customStart, customEnd));
    return lottoDraws.filter((draw) => draw.round >= start && draw.round <= end);
  }, [customEnd, customStart, rangePreset]);
  const stats = useMemo(() => aggregateNumberStats(selectedDraws), [selectedDraws]);
  const selected = selectedNumber === null ? null : stats.find((stat) => stat.number === selectedNumber) ?? null;
  const cold = [...stats].sort((a, b) => b.gap - a.gap).slice(0, 10);
  const maxGap = Math.max(...cold.map((item) => item.gap), 1);
  const topPairs: PairStat[] = lottoPairStats.slice(0, 10);
  const maxPairCount = Math.max(...topPairs.map((item) => item.count), 1);
  const rangeLabel = rangePreset === "all" ? `제${oldestRound}~${latestRound}회` : rangePreset === "custom" ? `제${Math.min(customStart, customEnd)}~${Math.max(customStart, customEnd)}회` : `최근 ${rangePreset}회`;
  const selectedPairStats = selected ? lottoPairStats.filter((stat) => stat.numbers.includes(selected.number)).slice(0, 5) : [];

  return (
    <>
      <section className="card stats-card">
        <div className="stats-toolbar">
          <div><h3>번호별 출현 빈도</h3><p className="body-small">분석 회차를 정하고 번호를 누르면 자세히 볼 수 있어요.</p></div>
          <div className="segmented stats-range-tabs" role="group" aria-label="분석 회차 범위">
            {(["10", "50", "100", "all", "custom"] as const).map((item) => <button type="button" key={item} className={rangePreset === item ? "segment-on" : ""} aria-pressed={rangePreset === item} onClick={() => setRangePreset(item)}>{item === "all" ? "전체" : item === "custom" ? "직접 지정" : `최근 ${item}`}</button>)}
          </div>
        </div>
        {rangePreset === "custom" && <div className="round-range-inputs"><label>시작 회차 <input type="number" min={oldestRound} max={latestRound} value={customStart} onChange={(event) => setCustomStart(Number(event.currentTarget.value))} /></label><span>~</span><label>끝 회차 <input type="number" min={oldestRound} max={latestRound} value={customEnd} onChange={(event) => setCustomEnd(Number(event.currentTarget.value))} /></label></div>}
        <p className="body-small stats-range-label">현재 범위: {rangeLabel} · {selectedDraws.length}회</p>
        <StatHeatmap stats={stats} valueKey="totalCount" onSelect={(stat) => setSelectedNumber(stat.number)} />
        <p className="body-small">진할수록 선택한 회차에서 더 자주 나온 번호예요. 과거 빈도는 다음 추첨 확률을 바꾸지 않습니다.</p>
      </section>

      <section className="section distribution-grid">
        <DistributionCard title="홀짝 분포" description={`${rangeLabel} 기준 홀수:짝수 조합`} firstLabel="홀수" secondLabel="짝수" items={oddEvenDistribution(selectedDraws)} />
        <DistributionCard title="고저 분포" description={`${rangeLabel} 기준 낮은 번호:높은 번호 · 기준 1~22/23~45`} firstLabel="낮은 번호" secondLabel="높은 번호" items={lowHighDistribution(selectedDraws)} />
      </section>

      <SumDistribution draws={selectedDraws} />
      <FirstPrizeTrend draws={selectedDraws} />

      <section className="section card">
        <div className="section-head"><div><h3>오래 쉬고 있는 번호 Top 10</h3><p className="body-small">{rangeLabel} 기준 미출현 회차 수</p></div></div>
        <div className="bar-list">
          {cold.map((stat, index) => <Link href={`/results/${stat.lastSeenRound}`} className="bar-row" key={stat.number}><span className="bar-rank">{index + 1}</span><LottoBall number={stat.number} size="sm" /><span className="bar-track"><span className="bar-fill" style={{ "--bar-width": `${Math.max(8, (stat.gap / maxGap) * 100)}%` } as CSSProperties} /></span><strong>{stat.gap}회</strong></Link>)}
        </div>
      </section>

      <section className="section card">
        <div className="section-head"><div><h3>궁합수 Top 10</h3><p className="body-small">여섯 당첨번호 안에서 두 번호가 함께 나온 횟수</p></div></div>
        <div className="bar-list">
          {topPairs.map((stat, index) => <div className="bar-row pair-bar-row" key={stat.numbers.join("-")}><span className="bar-rank">{index + 1}</span><span className="pair-balls" aria-label={`${stat.numbers[0]}번과 ${stat.numbers[1]}번`}><LottoBall number={stat.numbers[0]} size="sm" /><LottoBall number={stat.numbers[1]} size="sm" /></span><span className="bar-track"><span className="bar-fill" style={{ "--bar-width": `${Math.max(8, (stat.count / maxPairCount) * 100)}%` } as CSSProperties} /></span><strong>{stat.count}회</strong></div>)}
        </div>
        <p className="body-small pair-notice">궁합수는 과거 동시출현 통계입니다. 각 추첨은 독립 시행이므로 자주 함께 나온 번호가 다음 회차에 더 잘 나오는 것은 아닙니다.</p>
      </section>

      <ResultSheet open={Boolean(selected)} title={`${selected?.number ?? ""}번 통계`} onClose={() => setSelectedNumber(null)}>
        {selected && <div className="stack">
          <div className="row"><LottoBall number={selected.number} size="lg" /><Badge>최근 {selected.gap}회 미출현</Badge></div>
          <dl className="stat-detail"><div><dt>선택 범위 누적</dt><dd>{selected.totalCount}회</dd></div><div><dt>최근 출현</dt><dd>제{selected.lastSeenRound}회</dd></div><div><dt>전체 누적</dt><dd>{aggregateNumberStats(lottoDraws)[selected.number - 1].totalCount}회</dd></div></dl>
          <div><h4>궁합수 Top 5</h4><p className="body-small">전체 데이터 기준 함께 나온 횟수</p></div>
          <div className="detail-pair-list">{selectedPairStats.map((stat) => { const other = stat.numbers[0] === selected.number ? stat.numbers[1] : stat.numbers[0]; return <div className="detail-pair-row" key={stat.numbers.join("-")}><LottoBall number={other} size="sm" /><span>{stat.count}회 함께 출현</span></div>; })}</div>
          <p className="body-small">통계는 과거 결과를 읽는 도구이며 다음 번호를 예측하지 않습니다.</p>
        </div>}
      </ResultSheet>
    </>
  );
}
