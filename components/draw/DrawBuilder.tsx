"use client";

import { useMemo, useState } from "react";
import { ProductButton } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ConditionChip } from "@/components/lotto/ConditionChip";
import { LottoBall } from "@/components/lotto/LottoBall";
import { NumberGrid } from "@/components/lotto/NumberGrid";
import { PresetCard } from "@/components/lotto/PresetCard";
import { ResultSheet } from "@/components/lotto/ResultSheet";
import { TextField } from "@/components/ui/TextField";
import { lottoDraws, lottoPairStats } from "@/data/draws";
import { drawNumbers } from "@/lib/draw-engine";
import { aggregateNumberStats } from "@/lib/stats";
import { saveSavedSet, type SavedSet, type SavedSetInput, type SavedSetNumbers } from "@/lib/storage";
import type { DrawConditions, DrawRequest, DrawResult } from "@/lib/types";

type Preset = "random" | "hot" | "cold" | "fixed" | "carryover" | "pair";
type SumMode = "none" | "narrow" | "wide" | "custom";

const COUNT_OPTIONS = [0, 1, 2, 3, 4, 5, 6] as const;

const presetCopy: Record<Preset, { title: string; copy: string }> = {
  random: { title: "완전 랜덤", copy: "아무 조건도 더하지 않고 1부터 45까지 같은 기회로 여섯 번호를 골라요. 기본 필터만 적용되며, 언제든 다른 조건을 함께 켤 수 있어요." },
  hot: { title: "최근 자주 나온 번호", copy: "최근 30회 출현 횟수가 높은 번호에 잠정 가중치를 더해 골라요. 과거 빈도는 다음 회차의 당첨 확률을 바꾸지 않으며, 조합을 고르는 재미를 위한 기준이에요." },
  cold: { title: "한동안 쉬고 있는 번호", copy: "마지막으로 나온 지 오래된 상위 20개 번호에 가중치를 더해 골라요. 오래 나오지 않았다는 사실이 다음 추첨에서 나올 가능성을 높이지는 않아요." },
  fixed: { title: "내 번호 넣기", copy: "꼭 넣고 싶은 번호를 최대 5개까지 정하고, 남은 자리는 안전한 난수로 채워요. 넣을 번호와 뺄 번호가 겹치면 넣을 번호를 우선해요." },
  carryover: { title: "지난 회차 번호 섞기", copy: "직전 회차 당첨번호 중 하나를 반드시 포함하고 나머지를 새로 골라요. 같은 숫자가 연속 회차에 나오는 현상을 재미있게 살펴보는 조건이에요." },
  pair: { title: "궁합수", copy: "과거 회차에서 함께 나온 횟수가 많은 번호를 참고해요. 기준 번호는 조합에 포함하고, 상위 K개 궁합수에 등장한 동반 번호에 가중치를 더해요." },
};

export function DrawBuilder({ preset = "random" }: { preset?: Preset }) {
  const [fixed, setFixed] = useState<number[]>([]);
  const [excluded, setExcluded] = useState<number[]>([]);
  const [editing, setEditing] = useState<"fixed" | "excluded" | null>(preset === "fixed" ? "fixed" : null);
  const [hot, setHot] = useState(preset === "hot");
  const [cold, setCold] = useState(preset === "cold");
  const [carryover, setCarryover] = useState(preset === "carryover");
  const [pairBase, setPairBase] = useState<number[]>([]);
  const [pairTopK, setPairTopK] = useState(20);
  const [pairEditing, setPairEditing] = useState(false);
  const [noConsecutive3, setNoConsecutive3] = useState(true);
  const [noPastJackpot, setNoPastJackpot] = useState(true);
  const [noSameTail3, setNoSameTail3] = useState(false);
  const [oddCount, setOddCount] = useState<DrawConditions["oddCount"]>();
  const [lowCount, setLowCount] = useState<DrawConditions["lowCount"]>();
  const [sumMode, setSumMode] = useState<SumMode>("none");
  const [sumMin, setSumMin] = useState(21);
  const [sumMax, setSumMax] = useState(255);
  const [maxSameTail, setMaxSameTail] = useState<DrawConditions["maxSameTail"]>();
  const [games, setGames] = useState<1 | 5>(1);
  const [result, setResult] = useState<DrawResult | null>(null);
  const [saved, setSaved] = useState(false);
  const [saveGameIndex, setSaveGameIndex] = useState(0);
  const [saveLabel, setSaveLabel] = useState("");
  const [saveMemo, setSaveMemo] = useState("");
  const [targetRound, setTargetRound] = useState(lottoDraws[0].round + 1);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [limitNotice, setLimitNotice] = useState<SavedSet | null>(null);
  const [pendingSave, setPendingSave] = useState<SavedSetInput | null>(null);
  const stats = useMemo(() => aggregateNumberStats(lottoDraws), []);
  const pairs = useMemo(() => preset === "pair" ? lottoPairStats : [], [preset]);
  const sumRange: [number, number] | undefined = sumMode === "none" ? undefined : sumMode === "narrow" ? [120, 160] : sumMode === "wide" ? [100, 180] : [sumMin, sumMax];

  const request = (): DrawRequest => ({
    conditions: {
      fixed: fixed.length ? fixed : undefined,
      excluded: excluded.length ? excluded : undefined,
      hot: hot ? { window: 30, weight: "mid" } : undefined,
      cold: cold ? { poolSize: 20 } : undefined,
      carryover: carryover ? { count: 1 } : undefined,
      pair: preset === "pair" ? { base: pairBase, topK: pairTopK } : undefined,
      oddCount,
      lowCount,
      sumRange,
      maxSameTail,
    },
    filters: { noConsecutive3, noPastJackpot, noSameTail3 },
    games,
    presetId: preset,
  });

  const runDraw = () => {
    setSaved(false);
    setSaveGameIndex(0);
    setSaveError("");
    setLimitNotice(null);
    setPendingSave(null);
    setResult(drawNumbers(request(), { stats, pairStats: pairs, latestDraw: lottoDraws[0], pastDraws: lottoDraws }));
  };

  const toggleFixed = (number: number) => setFixed((current) => current.includes(number) ? current.filter((item) => item !== number) : current.length < 5 ? [...current, number].sort((a, b) => a - b) : current);
  const toggleExcluded = (number: number) => setExcluded((current) => current.includes(number) ? current.filter((item) => item !== number) : [...current, number].sort((a, b) => a - b));
  const updateSumMin = (value: number) => {
    if (!Number.isFinite(value)) return;
    const next = Math.min(255, Math.max(21, value));
    setSumMin(Math.min(next, sumMax));
    setSumMode("custom");
  };
  const updateSumMax = (value: number) => {
    if (!Number.isFinite(value)) return;
    const next = Math.min(255, Math.max(21, value));
    setSumMax(Math.max(next, sumMin));
    setSumMode("custom");
  };
  const buildSaveInput = (): SavedSetInput | null => {
    const game = result?.games[saveGameIndex];
    if (!game || game.length !== 6) return null;
    return {
      numbers: [...game].sort((a, b) => a - b) as SavedSetNumbers,
      conditions: request().conditions,
      conditionLabels: result.appliedChips,
      label: saveLabel,
      memo: saveMemo,
      targetRound,
      presetId: preset,
    };
  };
  const handleSave = async (replaceOldest = false) => {
    const input = replaceOldest && pendingSave ? pendingSave : buildSaveInput();
    if (!input) return;
    setSaving(true);
    setSaveError("");
    try {
      const outcome = await saveSavedSet(input, { replaceOldest });
      if (outcome.status === "limit") {
        setPendingSave(input);
        setLimitNotice(outcome.oldest);
        return;
      }
      setSaved(true);
      setPendingSave(null);
      setLimitNotice(null);
    } catch {
      setSaveError("브라우저 보관함을 사용할 수 없어요. 저장 권한을 확인해 주세요.");
    } finally {
      setSaving(false);
    }
  };
  const failed = result && result.games.length === 0;

  return (
    <>
      <section className="draw-intro">
        <p className="eyebrow">번호 추첨</p>
        <h1>어떻게 골라볼까요?</h1>
        <p className="body-color">조건을 고르지 않아도 바로 뽑을 수 있어요.</p>
      </section>

      <section className="section">
        <div className="section-head"><h3>바로 시작하기</h3><span className="body-small">프리셋</span></div>
        <div className="preset-grid">
          <PresetCard href="/draw" icon="random" title="완전 랜덤" description="조건 없이 가볍게" active={preset === "random"} />
          <PresetCard href="/draw/hot" icon="hot" title="핫넘버" description="최근 30회 · 중" active={preset === "hot"} />
          <PresetCard href="/draw/cold" icon="cold" title="미출현" description="상위 20개" active={preset === "cold"} />
          <PresetCard href="/draw/fixed" icon="fixed" title="내 번호" description="최대 5개 넣기" active={preset === "fixed"} />
          <PresetCard href="/draw/carryover" icon="carryover" title="이월수" description="직전 회차 1개" active={preset === "carryover"} />
          <PresetCard href="/draw/pair" icon="hot" title="궁합수" description="동시출현 Top K" active={preset === "pair"} />
        </div>
      </section>

      {preset === "pair" && (
        <section className="section card pair-builder">
          <div className="section-head">
            <div><h3>기준 번호</h3><p className="body-small">1~2개를 고르면 해당 번호와 자주 함께 나온 번호를 우선해요.</p></div>
            <span className="body-small">{pairBase.length}/2개</span>
          </div>
          <div className="row pair-builder-actions">
            <ProductButton size="small" tone="weak" onClick={() => setPairEditing((current) => !current)}>{pairEditing ? "선택 닫기" : "번호 고르기"}</ProductButton>
            {pairBase.length > 0 && <Badge tone="weak">기준 {pairBase.join(", ")}</Badge>}
          </div>
          {pairEditing && <NumberGrid selected={pairBase} maxSelected={2} onToggle={(number) => setPairBase((current) => current.includes(number) ? current.filter((item) => item !== number) : current.length < 2 ? [...current, number].sort((a, b) => a - b) : current)} />}
          <fieldset className="pair-topk">
            <legend>참고할 궁합수 범위</legend>
            <div className="segmented" role="group" aria-label="참고할 궁합수 범위">
              {[10, 20, 50, 100].map((count) => <button type="button" key={count} className={pairTopK === count ? "segment-on" : ""} aria-pressed={pairTopK === count} onClick={() => setPairTopK(count)}>상위 {count}</button>)}
            </div>
          </fieldset>
          <p className="body-small pair-notice">궁합수는 과거에 함께 나온 횟수일 뿐이에요. 각 추첨은 독립적으로 시행되므로 다음 당첨 확률을 높이지 않습니다.</p>
        </section>
      )}

      <section className="section card preset-description">
        <Badge tone="weak">{presetCopy[preset].title}</Badge>
        <p>{presetCopy[preset].copy}</p>
      </section>

      <hr className="divider draw-divider" />

      <section className="section">
        <div className="section-head"><h3>직접 조건 만들기</h3><span className="body-small">여러 개를 함께 켤 수 있어요</span></div>
        <div className="chip-wrap">
          <ConditionChip icon="pin" label="넣을 번호" value={fixed.length ? fixed.join(", ") : "번호 고르기"} checked={editing === "fixed" || fixed.length > 0} onChange={(checked) => { setEditing(checked ? "fixed" : null); if (!checked) setFixed([]); }} />
          <ConditionChip icon="exclude" label="뺄 번호" value={excluded.length ? `${excluded.length}개` : "번호 고르기"} checked={editing === "excluded" || excluded.length > 0} onChange={(checked) => { setEditing(checked ? "excluded" : null); if (!checked) setExcluded([]); }} />
          <ConditionChip icon="hot" label="핫넘버" value="최근 30회 · 중" checked={hot} onChange={setHot} />
          <ConditionChip icon="cold" label="미출현" value="상위 20개" checked={cold} onChange={setCold} />
          <ConditionChip icon="carryover" label="이월수" value="1개" checked={carryover} onChange={setCarryover} />
        </div>

        {editing && (
          <div className="number-picker card">
            <div className="section-head">
              <div><h4>{editing === "fixed" ? "꼭 넣고 싶은 번호" : "이번에는 빼고 싶은 번호"}</h4><p className="body-small">{editing === "fixed" ? `${fixed.length}/5개` : `${excluded.length}/39개`}</p></div>
              <ProductButton size="small" tone="weak" onClick={() => setEditing(null)}>선택 닫기</ProductButton>
            </div>
            {editing === "fixed" ? (
              <NumberGrid fixed={fixed} disabled={excluded} selected={fixed} maxSelected={5} onToggle={toggleFixed} />
            ) : (
              <NumberGrid excluded={excluded} disabled={fixed} selected={excluded} maxSelected={39} onToggle={toggleExcluded} />
            )}
          </div>
        )}
      </section>

      <section className="section">
        <details className="card advanced-conditions">
          <summary className="advanced-summary">
            <div>
              <h3>고급 조건</h3>
              <p className="body-small">홀짝·고저·합계·끝수까지 더 세밀하게 맞춰요. 기본은 제한 없음이에요.</p>
            </div>
            <span className="body-small">선택 사항</span>
          </summary>
          <div className="advanced-content">
            <fieldset className="advanced-group">
              <legend><img src="/icons/condition-odd-even.png" alt="" aria-hidden="true" />홀짝 비율</legend>
              <p className="body-small">홀수 개수와 짝수 개수를 정해요.</p>
              <div className="segmented" role="group" aria-label="홀짝 비율">
                <button type="button" className={oddCount === undefined ? "segment-on" : ""} aria-pressed={oddCount === undefined} onClick={() => setOddCount(undefined)}>제한 없음</button>
                {COUNT_OPTIONS.map((count) => (
                  <button type="button" className={oddCount === count ? "segment-on" : ""} aria-pressed={oddCount === count} aria-label={`${count}개 홀수, ${6 - count}개 짝수`} key={count} onClick={() => setOddCount(count)}>{count}:{6 - count}</button>
                ))}
              </div>
            </fieldset>

            <fieldset className="advanced-group">
              <legend><img src="/icons/condition-low-high.png" alt="" aria-hidden="true" />고저 비율</legend>
              <p className="body-small">낮은 번호는 1~22, 높은 번호는 23~45예요.</p>
              <div className="segmented" role="group" aria-label="고저 비율">
                <button type="button" className={lowCount === undefined ? "segment-on" : ""} aria-pressed={lowCount === undefined} onClick={() => setLowCount(undefined)}>제한 없음</button>
                {COUNT_OPTIONS.map((count) => (
                  <button type="button" className={lowCount === count ? "segment-on" : ""} aria-pressed={lowCount === count} aria-label={`${count}개 낮은 번호, ${6 - count}개 높은 번호`} key={count} onClick={() => setLowCount(count)}>{count}:{6 - count}</button>
                ))}
              </div>
            </fieldset>

            <fieldset className="advanced-group">
              <legend><img src="/icons/condition-sum.png" alt="" aria-hidden="true" />합계 구간</legend>
              <p className="body-small">여섯 번호의 합계를 원하는 범위 안에서 골라요.</p>
              <div className="segmented" role="group" aria-label="합계 구간">
                <button type="button" className={sumMode === "none" ? "segment-on" : ""} aria-pressed={sumMode === "none"} onClick={() => setSumMode("none")}>제한 없음</button>
                <button type="button" className={sumMode === "narrow" ? "segment-on" : ""} aria-pressed={sumMode === "narrow"} onClick={() => setSumMode("narrow")}>120~160</button>
                <button type="button" className={sumMode === "wide" ? "segment-on" : ""} aria-pressed={sumMode === "wide"} onClick={() => setSumMode("wide")}>100~180</button>
                <button type="button" className={sumMode === "custom" ? "segment-on" : ""} aria-pressed={sumMode === "custom"} onClick={() => setSumMode("custom")}>직접 입력</button>
              </div>
              {sumMode === "custom" && (
                <div className="advanced-range">
                  <label>최소 <input type="number" min="21" max="255" value={sumMin} aria-label="합계 최솟값" onChange={(event) => updateSumMin(event.currentTarget.valueAsNumber)} /></label>
                  <span className="advanced-range-separator" aria-hidden="true">~</span>
                  <label>최대 <input type="number" min="21" max="255" value={sumMax} aria-label="합계 최댓값" onChange={(event) => updateSumMax(event.currentTarget.valueAsNumber)} /></label>
                  <span className="body-small">21~255</span>
                </div>
              )}
            </fieldset>

            <fieldset className="advanced-group">
              <legend><img src="/icons/condition-tail.png" alt="" aria-hidden="true" />끝수 분산</legend>
              <p className="body-small">같은 일의 자리 숫자가 너무 많이 겹치지 않게 해요.</p>
              <div className="segmented" role="group" aria-label="끝수 분산">
                <button type="button" className={maxSameTail === undefined ? "segment-on" : ""} aria-pressed={maxSameTail === undefined} onClick={() => setMaxSameTail(undefined)}>제한 없음</button>
                <button type="button" className={maxSameTail === 1 ? "segment-on" : ""} aria-pressed={maxSameTail === 1} onClick={() => setMaxSameTail(1)}>1개 이하</button>
                <button type="button" className={maxSameTail === 2 ? "segment-on" : ""} aria-pressed={maxSameTail === 2} onClick={() => setMaxSameTail(2)}>2개 이하</button>
              </div>
            </fieldset>
          </div>
        </details>
      </section>

      <section className="section filter-card card">
        <div><h4>조합 다듬기</h4><p className="body-small">기본 필터는 언제든 끌 수 있어요.</p></div>
        <div className="chip-wrap">
          <ConditionChip icon="gear" label="3연속 번호 제외" checked={noConsecutive3} onChange={setNoConsecutive3} />
          <ConditionChip icon="gear" label="과거 1등 조합 제외" checked={noPastJackpot} onChange={setNoPastJackpot} />
          <ConditionChip icon="gear" label="같은 끝수 3개 제외" checked={noSameTail3} onChange={setNoSameTail3} />
        </div>
        <fieldset className="game-count">
          <legend>몇 게임을 뽑을까요?</legend>
          <label><input type="radio" name="games" checked={games === 1} onChange={() => setGames(1)} /> 1게임</label>
          <label><input type="radio" name="games" checked={games === 5} onChange={() => setGames(5)} /> 5게임</label>
        </fieldset>
      </section>

      {failed && (
        <section className="section card failure-card" role="alert">
          <h3>조건이 너무 좁아요. 어떤 조건을 풀어볼까요?</h3>
          <div className="chip-wrap">{result.relaxed?.map((item) => <Badge tone="danger" key={item}>{item}</Badge>)}</div>
        </section>
      )}

      <div className="draw-actions">
        <ProductButton className="full" onClick={runDraw}>번호 뽑기</ProductButton>
        <p className="body-small center">조건을 고르지 않으면 완전 랜덤으로 뽑아요</p>
      </div>

      <ResultSheet open={Boolean(result?.games.length)} title="이렇게 뽑았어요" onClose={() => setResult(null)}>
        {result && (
          <div className="stack" aria-live="polite">
            <div className="chip-wrap">{result.appliedChips.map((chip) => <Badge key={chip}>{chip}</Badge>)}</div>
            {result.relaxed?.map((item) => <p className="body-small" key={item}>{item}</p>)}
            <div className="result-games card">
              {result.games.map((game, gameIndex) => (
                <div className="result-game" key={game.join("-")}>
                  <strong>{String.fromCharCode(65 + gameIndex)}게임</strong>
                  <div className="numbers">{game.map((number, index) => <LottoBall key={number} number={number} size="sm" delay={index * 90} />)}</div>
                </div>
              ))}
            </div>
            <div className="sheet-actions"><ProductButton tone="weak" onClick={runDraw}>다시 뽑기</ProductButton></div>
            <section className="archive-save card">
              <div><h4>보관함에 저장</h4><p className="body-small">번호와 조건을 이 브라우저에만 저장해요.</p></div>
              {result.games.length > 1 && <label className="archive-select">저장할 게임
                <select value={saveGameIndex} onChange={(event) => setSaveGameIndex(Number(event.currentTarget.value))}>
                  {result.games.map((_, index) => <option value={index} key={index}>{String.fromCharCode(65 + index)}게임</option>)}
                </select>
              </label>}
              <TextField label="라벨" placeholder="예: 아빠 번호" value={saveLabel} onChange={(event) => setSaveLabel(event.currentTarget.value)} helpText="비워 두면 ‘저장한 번호’로 표시해요." />
              <TextField label="메모" placeholder="예: 다음 주 가족용" value={saveMemo} onChange={(event) => setSaveMemo(event.currentTarget.value)} />
              <TextField label="대상 회차" type="number" min="1" max={lottoDraws[0].round + 1} value={targetRound} onChange={(event) => { if (Number.isFinite(event.currentTarget.valueAsNumber)) setTargetRound(Math.max(1, Math.trunc(event.currentTarget.valueAsNumber))); }} helpText={`현재 데이터 기준 다음 회차는 제${lottoDraws[0].round + 1}회예요.`} />
              {limitNotice && <div className="archive-limit-warning" role="alert"><p>보관함이 가득 찼어요. 가장 오래된 ‘{limitNotice.label}’을 삭제하면 저장할 수 있어요.</p><div className="row"><ProductButton size="small" tone="danger" onClick={() => void handleSave(true)}>오래된 세트 삭제 후 저장</ProductButton><ProductButton size="small" tone="weak" onClick={() => { setLimitNotice(null); setPendingSave(null); }}>취소</ProductButton></div></div>}
              {saveError && <p className="archive-error" role="alert">{saveError}</p>}
              <ProductButton loading={saving} disabled={saved} onClick={() => void handleSave()}>{saved ? "저장했어요" : "보관함에 저장"}</ProductButton>
            </section>
            <p className="body-small center">모든 추첨 방식은 재미를 위한 것이며 당첨 확률에 영향을 주지 않습니다.</p>
          </div>
        )}
      </ResultSheet>
    </>
  );
}
