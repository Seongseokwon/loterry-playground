"use client";

import { useEffect, useState } from "react";
import { LottoBall } from "@/components/lotto/LottoBall";
import { Badge } from "@/components/ui/Badge";
import { ProductButton } from "@/components/ui/Button";
import { lottoDraws } from "@/data/draws";
import { judgeRank } from "@/lib/rank";
import { ARCHIVE_LIMIT, deleteSavedSet, getSavedSets, isStorageAvailable, type SavedSet } from "@/lib/storage";

function formatCreatedAt(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? "저장 시각을 알 수 없음" : new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium" }).format(date);
}

function getRank(set: SavedSet) {
  const draw = lottoDraws.find((item) => item.round === set.targetRound);
  return draw ? { draw, result: judgeRank(set.numbers, draw) } : null;
}

export function ArchivePanel() {
  const [sets, setSets] = useState<SavedSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    getSavedSets()
      .then((items) => { if (active) setSets(items); })
      .catch(() => { if (active) setError("보관함을 불러오지 못했어요. 브라우저 저장 권한을 확인해 주세요."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const remove = async (set: SavedSet) => {
    if (!window.confirm(`“${set.label}”을(를) 삭제할까요?`)) return;
    try {
      await deleteSavedSet(set.id);
      setSets((current) => current.filter((item) => item.id !== set.id));
    } catch {
      setError("번호를 삭제하지 못했어요. 잠시 후 다시 시도해 주세요.");
    }
  };

  if (!isStorageAvailable() && !loading) {
    return <section className="card archive-empty"><h2>이 브라우저에서는 보관함을 쓸 수 없어요</h2><p className="body-color">시크릿 모드나 저장소가 차단된 환경에서는 번호를 저장할 수 없습니다.</p></section>;
  }

  return (
    <div className="archive-panel">
      <div className="archive-toolbar">
        <p className="body-small">이 브라우저에만 저장돼요. 최대 {ARCHIVE_LIMIT}세트까지 보관할 수 있어요.</p>
        <Badge tone={sets.length >= ARCHIVE_LIMIT ? "danger" : "weak"}>{sets.length}/{ARCHIVE_LIMIT}</Badge>
      </div>
      {error && <p className="archive-error" role="alert">{error}</p>}
      {loading ? (
        <section className="card archive-empty"><p className="body-color">보관함을 불러오는 중이에요.</p></section>
      ) : sets.length === 0 ? (
        <section className="card archive-empty">
          <img className="archive-empty-icon" src="/icons/footer-ticket.png" alt="" aria-hidden="true" />
          <h2>아직 저장한 번호가 없어요</h2>
          <p className="body-color">번호를 뽑은 뒤 보관함에 저장해 보세요.</p>
        </section>
      ) : (
        <div className="archive-list">
          {sets.map((set) => {
            const judged = getRank(set);
            return (
              <article className="card archive-item" key={set.id}>
                <div className="archive-item-head">
                  <div><h2>{set.label}</h2><p className="body-small">{formatCreatedAt(set.createdAt)}</p></div>
                  <ProductButton size="small" tone="danger" onClick={() => void remove(set)}>삭제</ProductButton>
                </div>
                <div className="numbers archive-numbers">{set.numbers.map((number) => <LottoBall key={number} number={number} size="sm" />)}</div>
                <div className="archive-meta">
                  {judged ? (
                    <div className="archive-rank"><Badge tone={judged.result.rank === "낙첨" ? "neutral" : "fill"}>{judged.result.rank}</Badge><span>제{judged.draw.round}회 · {judged.result.matched}개 일치</span></div>
                  ) : <Badge tone="weak">제{set.targetRound}회 결과 대기</Badge>}
                  <span className="body-small">대상 회차 제{set.targetRound}회</span>
                </div>
                {set.conditionLabels.length > 0 && <div className="chip-wrap archive-chips">{set.conditionLabels.map((label) => <Badge key={label}>{label}</Badge>)}</div>}
                {set.memo && <p className="archive-memo">{set.memo}</p>}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
