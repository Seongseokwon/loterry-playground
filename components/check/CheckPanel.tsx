"use client";

import { useMemo, useState } from "react";
import { LottoBall } from "@/components/lotto/LottoBall";
import { NumberGrid } from "@/components/lotto/NumberGrid";
import { ProductButton } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { judgeRank, type RankResult } from "@/lib/rank";
import { mockDraws } from "@/mocks/draws";

export function CheckPanel() {
  const [selected, setSelected] = useState<number[]>([]);
  const [round, setRound] = useState(1236);
  const [result, setResult] = useState<RankResult | null>(null);
  const draw = useMemo(() => mockDraws.find((item) => item.round === round) ?? mockDraws[0], [round]);
  const toggle = (number: number) => {
    setResult(null);
    setSelected((current) => current.includes(number) ? current.filter((item) => item !== number) : current.length < 6 ? [...current, number].sort((a, b) => a - b) : current);
  };
  return (
    <div className="check-layout">
      <section className="card stack">
        <label className="round-select">확인할 회차
          <select value={round} onChange={(event) => { setRound(Number(event.target.value)); setResult(null); }}>
            {mockDraws.map((item) => <option value={item.round} key={item.round}>제{item.round}회 · {item.date}</option>)}
          </select>
        </label>
        <div>
          <div className="section-head"><h3>A게임</h3><span className="body-small">{selected.length}/6개</span></div>
          <NumberGrid selected={selected} maxSelected={6} onToggle={toggle} />
        </div>
        <div className="row">
          <ProductButton tone="weak" size="large" onClick={() => { setSelected([]); setResult(null); }}>다시 고르기</ProductButton>
          <ProductButton size="large" disabled={selected.length !== 6} onClick={() => setResult(judgeRank(selected, draw))}>당첨 확인하기</ProductButton>
        </div>
      </section>

      <aside className={`check-result card ${result && result.rank !== "낙첨" ? "card-weak" : ""}`} aria-live="polite">
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
  );
}
