"use client";

import { useMemo, useState } from "react";
import { LottoBall } from "@/components/lotto/LottoBall";
import { NumberGrid } from "@/components/lotto/NumberGrid";
import { ProductButton } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { lottoDraws } from "@/data/draws";
import { judgeRank, type RankResult } from "@/lib/rank";
import { saveSavedSet, type SavedSetNumbers } from "@/lib/storage";
import { trackEvent } from "@/lib/analytics";
import { analyzeTicketNumbers } from "@/lib/ticket-analysis";
import { TicketScanner, type TicketScanResult } from "@/components/check/TicketScanner";

export function CheckPanel() {
  const [selected, setSelected] = useState<number[]>([]);
  const [round, setRound] = useState(lottoDraws[0].round);
  const [result, setResult] = useState<RankResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");
  const draw = useMemo(() => lottoDraws.find((item) => item.round === round) ?? lottoDraws[0], [round]);
  const analysis = useMemo(() => analyzeTicketNumbers(selected), [selected]);
  const toggle = (number: number) => {
    setResult(null);
    setSaved(false);
    setSaveError("");
    setSelected((current) => current.includes(number) ? current.filter((item) => item !== number) : current.length < 6 ? [...current, number].sort((a, b) => a - b) : current);
  };
  const saveSelected = async () => {
    if (selected.length !== 6) return;
    setSaving(true);
    setSaveError("");
    try {
      const input = {
        numbers: [...selected].sort((a, b) => a - b) as SavedSetNumbers,
        conditions: { fixed: [...selected] },
        conditionLabels: ["직접 선택"],
        label: "확인한 번호",
        memo: "",
        targetRound: round,
        presetId: "manual-check",
      };
      let outcome = await saveSavedSet(input);
      if (outcome.status === "limit") {
        const replace = window.confirm(`보관함이 가득 찼어요. 가장 오래된 ‘${outcome.oldest.label}’을 삭제하고 저장할까요?`);
        if (!replace) return;
        outcome = await saveSavedSet(input, { replaceOldest: true });
      }
      if (outcome.status === "saved") {
        setSaved(true);
        trackEvent("set_saved", { source: "check", targetRound: input.targetRound });
      }
    } catch {
      setSaveError("번호를 저장하지 못했어요. 브라우저 저장 권한을 확인해 주세요.");
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="check-page-stack">
      <TicketScanner onNumbersDetected={(scan: TicketScanResult) => {
        setSelected(scan.numbers);
        if (scan.round && lottoDraws.some((item) => item.round === scan.round)) setRound(scan.round);
        setResult(null);
        setSaved(false);
        setSaveError("");
      }} />
      <div className="check-layout">
      <section className="card stack">
        <label className="round-select">확인할 회차
          <select value={round} onChange={(event) => { setRound(Number(event.target.value)); setResult(null); setSaved(false); setSaveError(""); }}>
            {lottoDraws.map((item) => <option value={item.round} key={item.round}>제{item.round}회 · {item.date}</option>)}
          </select>
        </label>
        <div>
          <div className="section-head"><h3>A게임</h3><span className="body-small">{selected.length}/6개</span></div>
          <NumberGrid selected={selected} maxSelected={6} onToggle={toggle} />
        </div>
        <div className="row">
          <ProductButton tone="weak" size="large" onClick={() => { setSelected([]); setResult(null); setSaved(false); setSaveError(""); }}>다시 고르기</ProductButton>
          <ProductButton size="large" disabled={selected.length !== 6} onClick={() => setResult(judgeRank(selected, draw))}>당첨 확인하기</ProductButton>
          <ProductButton tone="weak" size="large" loading={saving} disabled={selected.length !== 6 || saved} onClick={() => void saveSelected()}>{saved ? "저장했어요" : "번호 저장"}</ProductButton>
        </div>
        {saveError && <p className="archive-error" role="alert">{saveError}</p>}
      </section>

      <aside className={`check-result card ${result && result.rank !== "낙첨" ? "card-weak" : ""}`} aria-live="polite">
        {analysis && <section className="ticket-analysis" aria-label="내 번호 조합 분석">
          <div className="ticket-analysis-head">
            <div>
              <p className="eyebrow">내 번호 리포트</p>
              <h3>{analysis.primaryLabel}</h3>
            </div>
            <Badge tone="weak">재미 분석</Badge>
          </div>
          <div className="ticket-analysis-tags">{analysis.labels.map((label) => <span key={label}>{label}</span>)}</div>
          <dl className="ticket-analysis-grid">
            <div><dt>홀짝</dt><dd>{analysis.oddCount} : {analysis.evenCount}</dd></div>
            <div><dt>낮은 수·높은 수</dt><dd>{analysis.lowCount} : {analysis.highCount}</dd></div>
            <div><dt>번호 합계</dt><dd>{analysis.sum}</dd></div>
            <div><dt>번호 범위</dt><dd>{analysis.span}</dd></div>
            <div><dt>생일 번호(1~31)</dt><dd>{analysis.birthdayCount}개</dd></div>
            <div><dt>연속 번호</dt><dd>{analysis.consecutivePairs}쌍</dd></div>
          </dl>
          <p className="body-small">번호의 모양을 설명하는 재미 기능이며, 어떤 조합도 당첨 확률을 높이거나 예측하지 않습니다.</p>
        </section>}
        {!result ? (
          <div className="empty-result"><img className="empty-result-icon" src="/icons/footer-ticket.png" alt="" aria-hidden="true" /><h3>6개를 고르면 바로 확인해요</h3><p className="body-small">선택한 회차의 당첨번호와 안전하게 비교합니다.</p></div>
        ) : (
          <div className="stack">
            <div className="result-title">
              <Badge tone={result.rank === "낙첨" ? "neutral" : "fill"}>{result.rank}</Badge>
              <h2>{result.rank === "낙첨" ? "아쉽게 빗나갔어요" : `${result.rank} 당첨!`}</h2>
              <p className="body-color">{result.rank === "낙첨" ? "3개 맞으면 5등이에요" : `${result.matched}개 번호가 맞았어요`}</p>
            </div>
            <div className="numbers">{selected.map((number) => <LottoBall key={number} number={number} matched={result.matchedNumbers.includes(number) || (result.bonus && number === draw.bonus)} />)}</div>
            <hr className="divider" />
            <p className="body-small">제{draw.round}회 당첨번호</p>
            <div className="numbers">{draw.numbers.map((number) => <LottoBall key={number} number={number} size="sm" />)}<span className="plus">+</span><LottoBall number={draw.bonus} size="sm" /></div>
          </div>
        )}
      </aside>
      </div>
    </div>
  );
}
