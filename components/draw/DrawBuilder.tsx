"use client";

import { useMemo, useState } from "react";
import { ProductButton } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ConditionChip } from "@/components/lotto/ConditionChip";
import { LottoBall } from "@/components/lotto/LottoBall";
import { NumberGrid } from "@/components/lotto/NumberGrid";
import { PresetCard } from "@/components/lotto/PresetCard";
import { ResultSheet } from "@/components/lotto/ResultSheet";
import { drawNumbers } from "@/lib/draw-engine";
import { aggregateNumberStats } from "@/lib/stats";
import type { DrawRequest, DrawResult } from "@/lib/types";
import { mockDraws } from "@/mocks/draws";

type Preset = "random" | "hot" | "cold" | "fixed" | "carryover";

const presetCopy: Record<Preset, { title: string; copy: string }> = {
  random: { title: "완전 랜덤", copy: "아무 조건도 더하지 않고 1부터 45까지 같은 기회로 여섯 번호를 골라요. 기본 필터만 적용되며, 언제든 다른 조건을 함께 켤 수 있어요." },
  hot: { title: "최근 자주 나온 번호", copy: "최근 30회 출현 횟수가 높은 번호에 잠정 가중치를 더해 골라요. 과거 빈도는 다음 회차의 당첨 확률을 바꾸지 않으며, 조합을 고르는 재미를 위한 기준이에요." },
  cold: { title: "한동안 쉬고 있는 번호", copy: "마지막으로 나온 지 오래된 상위 20개 번호에 가중치를 더해 골라요. 오래 나오지 않았다는 사실이 다음 추첨에서 나올 가능성을 높이지는 않아요." },
  fixed: { title: "내 번호 넣기", copy: "꼭 넣고 싶은 번호를 최대 5개까지 정하고, 남은 자리는 안전한 난수로 채워요. 넣을 번호와 뺄 번호가 겹치면 넣을 번호를 우선해요." },
  carryover: { title: "지난 회차 번호 섞기", copy: "직전 회차 당첨번호 중 하나를 반드시 포함하고 나머지를 새로 골라요. 같은 숫자가 연속 회차에 나오는 현상을 재미있게 살펴보는 조건이에요." },
};

export function DrawBuilder({ preset = "random" }: { preset?: Preset }) {
  const [fixed, setFixed] = useState<number[]>([]);
  const [excluded, setExcluded] = useState<number[]>([]);
  const [editing, setEditing] = useState<"fixed" | "excluded" | null>(preset === "fixed" ? "fixed" : null);
  const [hot, setHot] = useState(preset === "hot");
  const [cold, setCold] = useState(preset === "cold");
  const [carryover, setCarryover] = useState(preset === "carryover");
  const [noConsecutive3, setNoConsecutive3] = useState(true);
  const [noPastJackpot, setNoPastJackpot] = useState(true);
  const [noSameTail3, setNoSameTail3] = useState(false);
  const [games, setGames] = useState<1 | 5>(1);
  const [result, setResult] = useState<DrawResult | null>(null);
  const [saved, setSaved] = useState(false);
  const stats = useMemo(() => aggregateNumberStats(mockDraws), []);

  const request = (): DrawRequest => ({
    conditions: {
      fixed: fixed.length ? fixed : undefined,
      excluded: excluded.length ? excluded : undefined,
      hot: hot ? { window: 30, weight: "mid" } : undefined,
      cold: cold ? { poolSize: 20 } : undefined,
      carryover: carryover ? { count: 1 } : undefined,
    },
    filters: { noConsecutive3, noPastJackpot, noSameTail3 },
    games,
    presetId: preset,
  });

  const runDraw = () => {
    setSaved(false);
    setResult(drawNumbers(request(), { stats, latestDraw: mockDraws[0], pastDraws: mockDraws }));
  };

  const toggleFixed = (number: number) => setFixed((current) => current.includes(number) ? current.filter((item) => item !== number) : current.length < 5 ? [...current, number].sort((a, b) => a - b) : current);
  const toggleExcluded = (number: number) => setExcluded((current) => current.includes(number) ? current.filter((item) => item !== number) : [...current, number].sort((a, b) => a - b));
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
        </div>
      </section>

      <section className="section card preset-description">
        <Badge tone="weak">{presetCopy[preset].title}</Badge>
        <p>{presetCopy[preset].copy}</p>
      </section>

      <hr className="divider draw-divider" />

      <section className="section">
        <div className="section-head"><h3>직접 조건 만들기</h3><span className="body-small">여러 개를 함께 켤 수 있어요</span></div>
        <div className="chip-wrap">
          <ConditionChip label="📌 넣을 번호" value={fixed.length ? fixed.join(", ") : "번호 고르기"} checked={editing === "fixed" || fixed.length > 0} onChange={(checked) => { setEditing(checked ? "fixed" : null); if (!checked) setFixed([]); }} />
          <ConditionChip label="🚫 뺄 번호" value={excluded.length ? `${excluded.length}개` : "번호 고르기"} checked={editing === "excluded" || excluded.length > 0} onChange={(checked) => { setEditing(checked ? "excluded" : null); if (!checked) setExcluded([]); }} />
          <ConditionChip label="🔥 핫넘버" value="최근 30회 · 중" checked={hot} onChange={setHot} />
          <ConditionChip label="🧊 미출현" value="상위 20개" checked={cold} onChange={setCold} />
          <ConditionChip label="♻️ 이월수" value="1개" checked={carryover} onChange={setCarryover} />
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

      <section className="section filter-card card">
        <div><h4>조합 다듬기</h4><p className="body-small">기본 필터는 언제든 끌 수 있어요.</p></div>
        <div className="chip-wrap">
          <ConditionChip label="⚙️ 3연속 번호 제외" checked={noConsecutive3} onChange={setNoConsecutive3} />
          <ConditionChip label="⚙️ 과거 1등 조합 제외" checked={noPastJackpot} onChange={setNoPastJackpot} />
          <ConditionChip label="⚙️ 같은 끝수 3개 제외" checked={noSameTail3} onChange={setNoSameTail3} />
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
            <div className="sheet-actions">
              <ProductButton tone="weak" onClick={runDraw}>다시 뽑기</ProductButton>
              <ProductButton onClick={() => setSaved(true)}>{saved ? "저장했어요" : "보관함에 저장"}</ProductButton>
            </div>
            <p className="body-small center">모든 추첨 방식은 재미를 위한 것이며 당첨 확률에 영향을 주지 않습니다.</p>
          </div>
        )}
      </ResultSheet>
    </>
  );
}
