"use client";

import { useMemo, useState } from "react";
import { lottoDraws } from "@/data/draws";
import { analyzeLab, backtestLab, type LabStrategy } from "@/lib/pattern-lab";
import { backtestExperiments, experimentVariants, labContext, labRequest, sampleExperiment, variantConfig, type LabConfig } from "@/lib/lab-experiment";
import { drawPattern, formatPattern, patternKey } from "@/lib/next-pattern";
import { aggregateNumberStats, pairStats } from "@/lib/stats";
import { LottoBall } from "@/components/lotto/LottoBall";
import { ProductButton } from "@/components/ui/Button";

const labels: Record<LabStrategy, string> = { exact: "동일 패턴 전이", similar: "유사 패턴 전이", frequency: "전체 패턴 빈도" };

export function PatternLab() {
  const [windowValue, setWindowValue] = useState("all");
  const [strategy, setStrategy] = useState<LabStrategy>("exact");
  const [selection, setSelection] = useState("");
  const [hot, setHot] = useState(false);
  const [cold, setCold] = useState(false);
  const [pair, setPair] = useState(false);
  const [usePattern, setUsePattern] = useState(true);
  const [hotWindow, setHotWindow] = useState<0 | 10 | 30 | 50>(30);
  const [hotWeight, setHotWeight] = useState<"low" | "mid" | "high">("mid");
  const [coldPool, setColdPool] = useState<15 | 20 | 25>(15);
  const [pairWindow, setPairWindow] = useState<30 | 50 | 100>(100);
  const [pairTop, setPairTop] = useState(10);
  const [pairBase, setPairBase] = useState("");
  const [sampleCount, setSampleCount] = useState(100);
  const [result, setResult] = useState<ReturnType<typeof sampleExperiment> | null>(null);
  const [comparison, setComparison] = useState<{ name: string; result: ReturnType<typeof sampleExperiment> }[]>([]);
  const [backtest, setBacktest] = useState<ReturnType<typeof backtestExperiments> | null>(null);
  const [saved, setSaved] = useState<{ id: string; createdAt: string; config: LabConfig; pattern?: number[] | null; round?: number; count: number; comparison: typeof comparison; backtest?: typeof backtest }[]>([]);
  const [error, setError] = useState("");
  const windowSize = windowValue === "all" ? Infinity : Number(windowValue);
  const analysis = useMemo(() => analyzeLab(lottoDraws, strategy, windowSize), [strategy, windowSize]);
  const selected = analysis.candidates.find((item) => patternKey(item.pattern) === selection) ?? analysis.candidates[0];
  const stats = useMemo(() => aggregateNumberStats(lottoDraws), []);
  const hotCount = (s: typeof stats[number]) => hotWindow === 10 ? s.countRecent10 : hotWindow === 30 ? s.countRecent30 : hotWindow === 50 ? s.countRecent50 : s.totalCount;
  const hotNumbers = [...stats].sort((a, b) => hotCount(b) - hotCount(a) || a.number - b.number).slice(0, 15);
  const coldNumbers = useMemo(() => [...stats].sort((a, b) => b.gap - a.gap || a.number - b.number).slice(0, coldPool), [stats, coldPool]);
  const pairs = useMemo(() => pairStats(lottoDraws.slice(0, pairWindow)).filter((item) => !pairBase || item.numbers.includes(Number(pairBase))).slice(0, pairTop), [pairWindow, pairBase, pairTop]);
  const tests = useMemo(() => (["exact", "similar", "frequency"] as LabStrategy[]).map((name) => ({ name, ...backtestLab(lottoDraws, name, windowSize) })), [windowSize]);
  const config: LabConfig = { pattern: usePattern, strategy, windowSize: windowValue === "all" ? 0 : windowSize, hot, hotWindow, hotWeight, cold, coldPool, pair, pairWindow, pairTop, pairBase: pairBase ? Number(pairBase) : null };
  const effectiveConfig = { ...config, windowSize: config.windowSize || Infinity };
  const context = useMemo(() => labContext(lottoDraws), []);
  const reset = () => { setResult(null); setComparison([]); setBacktest(null); setError(""); };
  const generate = () => {
    const request = labRequest(effectiveConfig, lottoDraws, selected?.pattern);
    if (!request) { setError("적용할 패턴이 없습니다. 패턴을 끄거나 분석 범위를 바꿔 주세요."); return; }
    const response = sampleExperiment(request, context, sampleCount);
    setResult(response);
    setError(response.failed ? `${response.failed}회 생성에 실패했어요. 조건을 확인해 주세요.` : "");
  };
  const compare = () => {
    const rows = experimentVariants.flatMap((name) => { const request = labRequest(variantConfig(effectiveConfig, name), lottoDraws, name === "무작위" ? undefined : selected?.pattern); return request ? [{ name, result: sampleExperiment(request, context, sampleCount) }] : []; });
    setComparison(rows); setError(rows.length < experimentVariants.length ? "패턴 사례가 없는 조합은 비교에서 제외했습니다." : "");
  };
  const loadSaved = () => { try { const raw = JSON.parse(localStorage.getItem("lotto-pattern-lab-experiments-v1") ?? "[]"); if (!Array.isArray(raw) || raw.some((item) => !item || typeof item.id !== "string" || typeof item.createdAt !== "string" || !item.config || !Array.isArray(item.comparison))) throw new Error(); setSaved(raw); setError(""); } catch { setError("저장된 실험을 읽을 수 없습니다. 기존 데이터는 변경하지 않았습니다."); } };
  const save = () => { try { const key = "lotto-pattern-lab-experiments-v1"; const existing = JSON.parse(localStorage.getItem(key) ?? "[]"); if (!Array.isArray(existing) || existing.some((item) => !item || typeof item.id !== "string" || !item.config || !Array.isArray(item.comparison))) throw new Error(); if (existing.length >= 20) { setError("저장 공간이 가득 찼어요. 실험 기록을 확인해 주세요."); return; } const entry = { id: crypto.randomUUID(), createdAt: new Date().toISOString(), config, pattern: usePattern ? selected?.pattern ?? null : null, count: sampleCount, comparison, backtest, round: lottoDraws[0].round }; const next = [entry, ...existing]; localStorage.setItem(key, JSON.stringify(next)); setSaved(next); setError(""); } catch { setError("실험을 저장하지 못했습니다. 브라우저 저장소를 확인해 주세요."); } };
  return <>
    <section className="draw-intro"><p className="eyebrow">데이터 실험</p><h1>패턴 연구실</h1><p className="body-color">과거 회차의 구간 흐름과 번호 통계를 비교하고 조합을 만들어 보세요.</p></section>
    <section className="section card pattern-lab">
      <h2>구간 패턴 분석</h2><p>현재 {lottoDraws[0].round}회: <strong>{formatPattern(drawPattern(lottoDraws[0]))}</strong></p><p className="body-small">순서: 1~10 · 11~20 · 21~30 · 31~40 · 41~45</p>
      <div className="pattern-lab-controls"><label>분석 범위 <select value={windowValue} onChange={(e) => { setWindowValue(e.target.value); setSelection(""); reset(); }}><option value="all">전체 회차</option><option value="300">최근 300회</option><option value="100">최근 100회</option></select></label>
      <label>분석 방식 <select value={strategy} onChange={(e) => { setStrategy(e.target.value as LabStrategy); setSelection(""); reset(); }}>{Object.entries(labels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label></div>
      <p className="body-small">{strategy === "frequency" ? "선택한 기간의 각 회차 패턴 빈도입니다." : strategy === "exact" ? "현재와 같은 패턴의 바로 다음 회차를 집계합니다." : "현재 패턴과 번호 한 개 이하의 구간 차이가 나는 회차의 다음 회차를 집계합니다."} 동률은 패턴 순서로 정렬합니다.</p>
      {selected ? <label>사용할 패턴 <select value={patternKey(selected.pattern)} onChange={(e) => { setSelection(e.target.value); reset(); }}>{analysis.candidates.map((item, i) => <option key={patternKey(item.pattern)} value={patternKey(item.pattern)}>{i + 1}위 · {formatPattern(item.pattern)} · {item.count}회</option>)}</select></label> : <p>일치 사례가 없습니다. 다른 분석 범위나 방식을 선택해 주세요.</p>}
      {strategy !== "frequency" && <details><summary>일치 사례 {analysis.examples.length}건 보기</summary><ul>{analysis.examples.map(({ observed, next, distance }) => <li key={observed.round}>{observed.round}회 ({formatPattern(drawPattern(observed))}, 거리 {distance}) → {next.round}회: {next.numbers.join(", ")} · {formatPattern(drawPattern(next))}</li>)}</ul></details>}
    </section>
    <section className="section card pattern-lab"><h2>번호 통계와 적용</h2><p className="body-small">구간 패턴은 고정 조건이며 핫·콜드·궁합수는 가중치입니다. 궁합 기준 번호를 지정하면 그 번호는 반드시 포함됩니다.</p>
      <p><label><input type="checkbox" checked={usePattern} onChange={(e) => { setUsePattern(e.target.checked); reset(); }} /> 구간 패턴 적용</label></p>
      <p><label><input type="checkbox" checked={hot} onChange={(e) => { setHot(e.target.checked); reset(); }} /> 핫넘버 적용</label> <label>기간 <select value={hotWindow} onChange={(e) => { setHotWindow(Number(e.target.value) as typeof hotWindow); reset(); }}><option value="10">10회</option><option value="30">30회</option><option value="50">50회</option><option value="0">전체</option></select></label> <label>가중치 <select value={hotWeight} onChange={(e) => { setHotWeight(e.target.value as typeof hotWeight); reset(); }}><option value="low">약</option><option value="mid">중</option><option value="high">강</option></select></label></p><p className="body-small">출현 상위 15개: {hotNumbers.map((s) => `${s.number}(${hotCount(s)}회)`).join(" · ")}</p>
      <p><label><input type="checkbox" checked={cold} onChange={(e) => { setCold(e.target.checked); reset(); }} /> 콜드넘버 적용</label> <label>후보 수 <select value={coldPool} onChange={(e) => { setColdPool(Number(e.target.value) as typeof coldPool); reset(); }}><option>15</option><option>20</option><option>25</option></select></label></p><p className="body-small">미출현 간격: {coldNumbers.map((s) => `${s.number}(${s.gap}회)`).join(" · ")}</p>
      <p><label><input type="checkbox" checked={pair} onChange={(e) => { setPair(e.target.checked); reset(); }} /> 궁합수 적용</label> <label>기간 <select value={pairWindow} onChange={(e) => { setPairWindow(Number(e.target.value) as typeof pairWindow); reset(); }}><option>30</option><option>50</option><option>100</option></select></label> <label>상위 쌍 <select value={pairTop} onChange={(e) => { setPairTop(Number(e.target.value)); reset(); }}><option>5</option><option>10</option><option>20</option></select></label> <label>기준 번호 <select value={pairBase} onChange={(e) => { setPairBase(e.target.value); reset(); }}><option value="">없음</option>{Array.from({ length: 45 }, (_, i) => <option key={i + 1}>{i + 1}</option>)}</select></label></p><p className="body-small">함께 출현한 쌍: {pairs.map((p) => `${p.numbers.join("-")}(${p.count}회)`).join(" · ")}</p>
      <p><label>반복 생성 횟수 <select value={sampleCount} onChange={(e) => { setSampleCount(Number(e.target.value)); reset(); }}><option>10</option><option>100</option><option>500</option></select></label></p>
      <div className="pattern-lab-controls"><ProductButton size="medium" onClick={generate}>선택 조건으로 생성</ProductButton><ProductButton size="medium" tone="weak" onClick={compare}>조합 비교</ProductButton></div>{error && <p role="alert">{error}</p>}{result && <><p>생성 {result.completed}/{result.requested}회 · 실패 {result.failed}회 (아래 최대 5개)</p>{result.games.map((game, index) => <div className="numbers" key={index}>{game.map((n) => <LottoBall key={n} number={n} />)}</div>)}</>}
      {comparison.length > 0 && <><h3>조합별 반복 결과</h3><p className="body-small">{usePattern ? "선택 조건과 비교 조합에 선택한 패턴을 공통 적용합니다. " : "모든 조합에 구간 패턴을 적용하지 않습니다. "}무작위는 조건 없이 생성합니다. 표시 횟수는 생성된 게임에서 해당 번호가 나온 횟수입니다.</p><div className="pattern-lab-table"><table><thead><tr><th>조합</th><th>성공 / 요청</th><th>출현 상위 번호</th></tr></thead><tbody>{comparison.map(({ name, result: row }) => <tr key={name}><th>{name}</th><td>{row.completed}/{row.requested}</td><td>{row.frequencies.map((count, i) => ({ n: i + 1, count })).sort((a, b) => b.count - a.count || a.n - b.n).slice(0, 5).map((x) => `${x.n} (${x.count}회)`).join(", ")}</td></tr>)}</tbody></table></div><ProductButton size="small" tone="weak" onClick={save}>비교와 실행된 백테스트 저장</ProductButton></>}
    </section>
    <section className="section card pattern-lab"><h2>조건 조합 과거 검증</h2><p className="body-small">최근 20회 각각에 대해 직전 데이터로 조합별 5게임을 생성해 본번호 일치 수를 비교합니다. 패턴은 당시 1위로 다시 계산합니다. 기준 번호는 궁합수 조합에서만 필수입니다. 생성은 무작위이므로 실행할 때마다 결과가 달라집니다.</p><ProductButton size="medium" tone="weak" onClick={() => { setBacktest(backtestExperiments(lottoDraws, effectiveConfig, 20, 5)); }}>백테스트 실행</ProductButton>{backtest && <div className="pattern-lab-table"><table><thead><tr><th>조합</th><th>평가 회차</th><th>게임 성공</th><th>생성 실패</th><th>일치 0~6개 게임 수</th></tr></thead><tbody>{backtest.map((row) => <tr key={row.name}><th>{row.name}</th><td>{row.rounds}회 (제외 {row.skipped}회)</td><td>{row.completed}</td><td>{row.failed}</td><td>{row.matches.join(" / ")}</td></tr>)}</tbody></table></div>}</section>
    <section className="section card pattern-lab"><h2>저장한 실험</h2><p className="body-small">비교 결과와 조건은 이 브라우저에 최대 20개 저장됩니다. 기기 간 동기화되지 않습니다.</p><ProductButton size="small" tone="weak" onClick={loadSaved}>저장 기록 불러오기</ProductButton>{saved.length > 0 && <ul>{saved.map((item) => <li key={item.id}><details><summary>{new Date(item.createdAt).toLocaleString("ko-KR")} · {item.count}회 반복 · {item.config.pattern ? "패턴 적용" : "패턴 미적용"}</summary><p>{item.round}회 기준 · {item.pattern?.join("·") ?? "패턴 없음"} · {labels[item.config.strategy]} · {item.config.windowSize || "전체"}회</p><p>선택 조건: 핫 {item.config.hot ? `${item.config.hotWindow || "전체"}회 / ${item.config.hotWeight}` : "꺼짐"} · 콜드 {item.config.cold ? `${item.config.coldPool}개` : "꺼짐"} · 궁합 {item.config.pair ? `${item.config.pairWindow}회 / ${item.config.pairTop}쌍 / 기준 ${item.config.pairBase ?? "없음"}` : "꺼짐"}</p><ul>{item.comparison.map((row) => <li key={row.name}>{row.name}: {row.result.completed}/{row.result.requested}회 · 상위 {row.result.frequencies.map((count, i) => ({ n: i + 1, count })).sort((a, b) => b.count - a.count || a.n - b.n).slice(0, 5).map((x) => `${x.n}(${x.count})`).join(", ")}</li>)}</ul>{item.backtest && <><p>백테스트: 일치 0~6개 게임 수</p><ul>{item.backtest.map((row) => <li key={row.name}>{row.name}: {row.rounds}회차 · 성공 {row.completed}게임 · {row.matches.join(" / ")}</li>)}</ul></>}</details></li>)}</ul>}</section>
    <section className="section card pattern-lab"><h2>과거 검증 · 최근 100회</h2><p className="body-small">각 회차 직전까지의 데이터만 사용해 다음 패턴을 예상합니다. 사례가 없어 예상할 수 없는 회차는 평가에서 제외합니다. 상위 3개는 최대 3개 후보를 뜻합니다.</p><div className="pattern-lab-table"><table><thead><tr><th>전략</th><th>평가</th><th>1위 일치</th><th>상위 3개</th><th>평균 거리</th></tr></thead><tbody>{tests.map((t) => <tr key={t.name}><th>{labels[t.name]}</th><td>{t.tested}/{t.requested}회</td><td>{t.hits}회 ({t.tested ? (t.hits / t.tested * 100).toFixed(1) : "0"}%)</td><td>{t.top3}회 ({t.tested ? (t.top3 / t.tested * 100).toFixed(1) : "0"}%)</td><td>{t.tested ? t.meanDistance.toFixed(2) : "-"}</td></tr>)}</tbody></table></div><p className="body-small">거리 1은 번호 한 개의 구간이 다른 정도입니다. 위 검증은 구간 패턴만 비교하며 핫·콜드·궁합수 가중치는 평가하지 않습니다.</p></section>
    <p className="body-small">이 연구실은 과거 데이터를 살펴보는 실험이며 당첨을 예측하지 않습니다.</p>
  </>;
}
