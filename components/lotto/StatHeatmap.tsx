"use client";

import type { CSSProperties } from "react";
import type { NumberStat } from "@/lib/types";

export function StatHeatmap({ stats, valueKey = "totalCount", onSelect }: { stats: NumberStat[]; valueKey?: "totalCount" | "countRecent10" | "countRecent50" | "countRecent100"; onSelect?: (stat: NumberStat) => void }) {
  const values = stats.map((stat) => stat[valueKey]);
  const min = Math.min(...values);
  const max = Math.max(...values);
  return (
    <div className="stat-heatmap" aria-label="번호별 출현 빈도">
      {stats.map((stat) => {
        const level = max === min ? 0 : Math.round(((stat[valueKey] - min) / (max - min)) * 4);
        const strength = `${12 + level * 15}%`;
        const content = <><strong>{stat.number}</strong><small>{stat[valueKey]}회</small></>;
        return onSelect ? (
          <button key={stat.number} type="button" className="heat-cell" style={{ "--heat-strength": strength } as CSSProperties} onClick={() => onSelect(stat)} aria-label={`${stat.number}번 ${stat[valueKey]}회`}>{content}</button>
        ) : (
          <div key={stat.number} className="heat-cell" style={{ "--heat-strength": strength } as CSSProperties}>{content}</div>
        );
      })}
    </div>
  );
}
