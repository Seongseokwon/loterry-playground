"use client";

import Link from "next/link";
import { useMemo, useState, type CSSProperties } from "react";
import { StatHeatmap } from "@/components/lotto/StatHeatmap";
import { ResultSheet } from "@/components/lotto/ResultSheet";
import { LottoBall } from "@/components/lotto/LottoBall";
import { Badge } from "@/components/ui/Badge";
import { aggregateNumberStats } from "@/lib/stats";
import type { NumberStat } from "@/lib/types";
import { mockDraws } from "@/mocks/draws";

type Period = "all" | "100" | "50" | "10";

export function StatsPanel() {
  const stats = useMemo(() => aggregateNumberStats(mockDraws), []);
  const [period, setPeriod] = useState<Period>("all");
  const [selected, setSelected] = useState<NumberStat | null>(null);
  const key = period === "10" ? "countRecent10" : period === "50" ? "countRecent50" : period === "100" ? "countRecent100" : "totalCount";
  const cold = [...stats].sort((a, b) => b.gap - a.gap).slice(0, 10);
  const maxGap = Math.max(...cold.map((item) => item.gap), 1);
  return (
    <>
      <section className="card stats-card">
        <div className="stats-toolbar">
          <div><h3>번호별 출현 빈도</h3><p className="body-small">번호를 누르면 자세히 볼 수 있어요.</p></div>
          <div className="segmented" role="group" aria-label="집계 기간">
            {(["all", "100", "50", "10"] as const).map((item) => <button type="button" key={item} className={period === item ? "segment-on" : ""} onClick={() => setPeriod(item)}>{item === "all" ? "전체" : `${item}회`}</button>)}
          </div>
        </div>
        <StatHeatmap stats={stats} valueKey={key} onSelect={setSelected} />
        <p className="body-small">진할수록 선택한 기간에 더 자주 나온 번호예요. 과거 빈도는 다음 추첨 확률을 바꾸지 않습니다.</p>
      </section>

      <section className="section card">
        <div className="section-head"><div><h3>오래 쉬고 있는 번호 Top 10</h3><p className="body-small">최신 제1236회 기준 미출현 회차 수</p></div></div>
        <div className="bar-list">
          {cold.map((stat, index) => (
            <Link href={`/results/${stat.lastSeenRound}`} className="bar-row" key={stat.number}>
              <span className="bar-rank">{index + 1}</span>
              <LottoBall number={stat.number} size="sm" />
              <span className="bar-track"><span className="bar-fill" style={{ "--bar-width": `${Math.max(8, (stat.gap / maxGap) * 100)}%` } as CSSProperties} /></span>
              <strong>{stat.gap}회</strong>
            </Link>
          ))}
        </div>
      </section>

      <ResultSheet open={Boolean(selected)} title={`${selected?.number ?? ""}번 통계`} onClose={() => setSelected(null)}>
        {selected && (
          <div className="stack">
            <div className="row"><LottoBall number={selected.number} size="lg" /><Badge>최근 {selected.gap}회 미출현</Badge></div>
            <dl className="stat-detail">
              <div><dt>104회 누적</dt><dd>{selected.totalCount}회</dd></div>
              <div><dt>최근 출현</dt><dd>제{selected.lastSeenRound}회</dd></div>
              <div><dt>최근 10회</dt><dd>{selected.countRecent10}회</dd></div>
              <div><dt>최근 50회</dt><dd>{selected.countRecent50}회</dd></div>
            </dl>
            <p className="body-small">통계는 과거 결과를 읽는 도구이며 다음 번호를 예측하지 않습니다.</p>
          </div>
        )}
      </ResultSheet>
    </>
  );
}
