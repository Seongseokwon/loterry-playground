"use client";

import { useEffect, useRef, useState } from "react";
import { LottoBall } from "@/components/lotto/LottoBall";
import { SavedStatsPanel } from "@/components/archive/SavedStatsPanel";
import { Badge } from "@/components/ui/Badge";
import { ProductButton } from "@/components/ui/Button";
import { lottoDraws } from "@/data/draws";
import { judgeRank } from "@/lib/rank";
import { ARCHIVE_LIMIT, deleteSavedSet, getSavedSets, importSavedSets, isStorageAvailable, type SavedSet } from "@/lib/storage";
import { trackEvent } from "@/lib/analytics";

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
  const [notice, setNotice] = useState("");
  const importInputRef = useRef<HTMLInputElement>(null);

  const exportBackup = () => {
    const blob = new Blob([JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), sets }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `lotto-play-ground-backup-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setNotice(`${sets.length}세트를 백업 파일로 내보냈어요.`);
  };

  const copyNumbers = async (set: SavedSet) => {
    try {
      await navigator.clipboard.writeText(set.numbers.join(", "));
      setNotice(`“${set.label}” 번호를 복사했어요.`);
    } catch {
      setError("번호를 복사하지 못했어요. 브라우저의 클립보드 권한을 확인해 주세요.");
    }
  };

  const importBackup = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text()) as { sets?: unknown } | unknown[];
      const imported = await importSavedSets(Array.isArray(parsed) ? parsed : parsed.sets);
      const items = await getSavedSets();
      setSets(items);
      setNotice(imported > 0 ? `${imported}세트를 가져왔어요.` : "가져올 수 있는 저장 공간이 없어요.");
    } catch {
      setError("백업 파일을 가져오지 못했어요. 이 서비스에서 내보낸 JSON 파일인지 확인해 주세요.");
    }
  };

  useEffect(() => {
    let active = true;
    getSavedSets()
      .then((items) => {
        if (!active) return;
        setSets(items);
        const trackedRounds = new Set<number>();
        items.forEach((item) => {
          if (!lottoDraws.some((draw) => draw.round === item.targetRound) || trackedRounds.has(item.targetRound)) return;
          trackedRounds.add(item.targetRound);
          const sessionKey = `lotto:saved-result-viewed:${item.targetRound}`;
          try {
            if (window.sessionStorage.getItem(sessionKey)) return;
            window.sessionStorage.setItem(sessionKey, "1");
          } catch {
            // Storage access can be blocked; the in-memory set still prevents duplicates in this render.
          }
          trackEvent("saved_result_viewed", { targetRound: item.targetRound });
        });
      })
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
      <div className="archive-tools card card-weak">
        <div><strong>번호 백업</strong><p className="body-small">브라우저를 바꾸거나 저장소를 지우기 전에 파일로 보관하세요.</p></div>
        <div className="row"><ProductButton size="small" tone="weak" onClick={exportBackup} disabled={sets.length === 0}>내보내기</ProductButton><ProductButton size="small" tone="weak" onClick={() => importInputRef.current?.click()}>가져오기</ProductButton><input ref={importInputRef} className="sr-only" type="file" accept="application/json,.json" onChange={(event) => void importBackup(event)} /></div>
      </div>
      {error && <p className="archive-error" role="alert">{error}</p>}
      {notice && <p className="archive-notice" role="status">{notice}</p>}
      {!loading && sets.length > 0 && <SavedStatsPanel sets={sets} />}
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
                  <div className="row"><ProductButton size="small" tone="weak" onClick={() => void copyNumbers(set)}>복사</ProductButton><ProductButton size="small" tone="danger" onClick={() => void remove(set)}>삭제</ProductButton></div>
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
