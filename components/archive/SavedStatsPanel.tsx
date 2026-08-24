"use client";

import { useMemo, useState } from "react";
import { LottoBall } from "@/components/lotto/LottoBall";
import { Badge } from "@/components/ui/Badge";
import { ProductButton } from "@/components/ui/Button";
import { analyzeSavedSets, generateWeightedCombination } from "@/lib/saved-stats";
import type { SavedSet, SavedSetNumbers } from "@/lib/storage";

export function SavedStatsPanel({ sets }: { sets: SavedSet[] }) {
  const [generated, setGenerated] = useState<SavedSetNumbers | null>(null);
  const analysis = useMemo(() => analyzeSavedSets(sets), [sets]);
  const sortedNumbers = useMemo(
    () => [...analysis.numbers].sort((a, b) => b.count - a.count || a.number - b.number),
    [analysis.numbers],
  );
  const maxCount = sortedNumbers[0]?.count ?? 0;

  const generate = () => setGenerated(generateWeightedCombination(sets));

  return (
    <section className="section card saved-stats-card">
      <div className="section-head saved-stats-head">
        <div>
          <p className="eyebrow">저장 번호 분석</p>
          <h2>내가 만든 번호는 어떤 숫자가 많을까요?</h2>
          <p className="body-small">저장한 {analysis.totalSets}세트, 총 {analysis.totalSelections}개 번호를 기준으로 집계했어요.</p>
        </div>
        <ProductButton size="small" tone="weak" onClick={generate}>빈도 기반 조합 생성</ProductButton>
      </div>

      {generated && (
        <div className="saved-generated-result" aria-live="polite">
          <div>
            <Badge tone="fill">새 조합</Badge>
            <p className="body-small">많이 저장된 번호일수록 선택될 가능성을 조금 높였어요.</p>
          </div>
          <div className="numbers">{generated.map((number) => <LottoBall key={number} number={number} size="sm" />)}</div>
        </div>
      )}

      <div className="saved-frequency-table-wrap">
        <table className="saved-frequency-table">
          <caption>저장한 번호별 생성 횟수</caption>
          <thead><tr><th scope="col">순위</th><th scope="col">번호</th><th scope="col">횟수</th><th scope="col">저장 세트 비율</th><th scope="col">비중</th></tr></thead>
          <tbody>
            {sortedNumbers.map((item, index) => (
              <tr key={item.number}>
                <th scope="row">{item.count === 0 ? "—" : index + 1}</th>
                <td><LottoBall number={item.number} size="sm" /></td>
                <td><strong>{item.count}회</strong></td>
                <td>{item.percentage}%</td>
                <td><span className="saved-frequency-track"><span style={{ width: maxCount === 0 ? "0%" : `${(item.count / maxCount) * 100}%` }} /></span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
