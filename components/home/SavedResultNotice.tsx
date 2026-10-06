"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { LottoBall } from "@/components/lotto/LottoBall";
import { lottoDraws } from "@/data/draws";
import { judgeRank } from "@/lib/rank";
import { getSavedSets, type SavedSet } from "@/lib/storage";

type ReadySet = { set: SavedSet; draw: (typeof lottoDraws)[number]; rank: ReturnType<typeof judgeRank> };

export function SavedResultNotice() {
  const [ready, setReady] = useState<ReadySet[]>([]);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    let active = true;
    getSavedSets().then((sets) => {
      if (!active) return;
      const readySets: ReadySet[] = [];
      let pending = 0;
      for (const set of sets) {
        const draw = lottoDraws.find((item) => item.round === set.targetRound);
        if (!draw) {
          pending += 1;
          continue;
        }
        readySets.push({ set, draw, rank: judgeRank(set.numbers, draw) });
      }
      setReady(readySets.slice(0, 3));
      setPendingCount(pending);
    }).catch(() => {
      if (active) setReady([]);
    });
    return () => { active = false; };
  }, []);

  if (ready.length === 0 && pendingCount === 0) return null;

  return (
    <section className="section saved-result-notice" aria-labelledby="saved-result-title">
      <div className="section-head">
        <div><p className="eyebrow">보관함 알림</p><h2 id="saved-result-title">확인할 번호가 있어요</h2></div>
        <Link className="text-link" href="/archive">보관함 보기 →</Link>
      </div>
      <div className="saved-result-list">
        {ready.map(({ set, draw, rank }) => (
          <Link className="card saved-result-item" href="/archive" key={set.id}>
            <div className="saved-result-item-head"><div><strong>{set.label}</strong><span className="body-small">제{draw.round}회 결과 확인</span></div><Badge tone={rank.rank === "낙첨" ? "neutral" : "fill"}>{rank.rank}</Badge></div>
            <div className="numbers archive-numbers">{set.numbers.map((number) => <LottoBall key={number} number={number} size="sm" />)}</div>
          </Link>
        ))}
      </div>
      {pendingCount > 0 && <p className="body-small">아직 결과가 발표되지 않은 번호 {pendingCount}세트도 보관 중이에요.</p>}
    </section>
  );
}
