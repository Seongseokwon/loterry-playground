"use client";

import { useState } from "react";
import Link from "next/link";
import { LottoBall } from "@/components/lotto/LottoBall";
import { ProductButton } from "@/components/ui/Button";
import { lottoDraws } from "@/data/draws";
import { recommendModels, type ModelPick } from "@/lib/model-picks";
import { saveSavedSet, type SavedSetNumbers } from "@/lib/storage";

export function ModelPicks() {
  const [picks, setPicks] = useState<ModelPick[]>([]);
  const [saved, setSaved] = useState<string[]>([]);
  const [saving, setSaving] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const latest = lottoDraws[0];
  const generate = () => { setPicks(recommendModels(lottoDraws)); setSaved([]); setMessage(""); };
  async function save(pick: ModelPick) {
    if (saving || saved.includes(pick.id)) return;
    setSaving(pick.id); setMessage("");
    try {
      const result = await saveSavedSet({ numbers: pick.numbers as SavedSetNumbers, conditions: {}, conditionLabels: ["모델 추천", pick.name], label: pick.name, memo: pick.explanation, targetRound: latest.round + 1, presetId: "model-picks" });
      if (result.status !== "saved") { setMessage("보관함이 가득 찼어요. 기존 조합을 정리한 뒤 다시 시도해 주세요."); return; }
      setSaved((current) => [...current, pick.id]);
      setMessage(`${pick.name}의 조합을 보관함에 저장했어요.`);
    } catch { setMessage("저장하지 못했어요. 브라우저 저장소를 확인해 주세요."); }
    finally { setSaving(null); }
  }
  return <div className="model-picks">
    <header className="page-header"><p className="eyebrow">서로 다른 시선, 네 가지 조합</p><h1>번호 탐험대</h1><p className="body-color">네 명의 탐험가가 같은 기록을 서로 다른 방법으로 살펴봐요. 마음에 드는 조합과 그 이유를 확인해 보세요.</p></header>
    <section className="model-intro"><div><span className="model-intro-label">제{latest.round.toLocaleString("ko-KR")}회까지의 데이터</span><h2>오늘은 어떤 시선으로<br />번호를 골라볼까요?</h2><p>최근 흐름, 미출현 간격, 함께 나온 번호와 무작위를 한 번에 비교해요.</p></div><ProductButton size="large" onClick={generate}>{picks.length ? "다시 탐험하기" : "네 가지 조합 만나기"}</ProductButton></section>
    <p className="model-disclaimer">이 모델들은 과거 기록을 활용한 재미있는 선택 방식입니다. 추첨은 독립적이며 모든 6개 조합의 당첨 확률은 같습니다.</p>
    {message && <p className="model-message" role="status">{message}</p>}
    {picks.length > 0 && <section className="model-grid" aria-label="모델별 추천 결과" aria-live="polite">{picks.map((pick, index) => <article className="card model-card" key={pick.id}>
      <div className="model-card-top"><span className="model-index">0{index + 1}</span><span className="model-label">{pick.id === "random" ? "기준 조합" : "과거 기록 참고"}</span></div><h2>{pick.name}</h2>
      <div className="numbers model-numbers" aria-label={`${pick.name} 추천 번호`}>{pick.numbers.map((number) => <LottoBall key={number} number={number} size="sm" />)}</div>
      <div className="model-reason"><h3>이렇게 골랐어요</h3><p>{pick.explanation}</p></div>
      <ProductButton size="medium" tone="weak" disabled={saved.includes(pick.id) || Boolean(saving)} loading={saving === pick.id} onClick={() => void save(pick)}>{saved.includes(pick.id) ? "보관함에 저장했어요" : "이 조합 저장"}</ProductButton>
    </article>)}</section>}
    <section className="model-more"><div><h2>직접 조건을 조합해보고 싶다면?</h2><p>패턴 연구실에서 분석 기간과 조건을 바꾸고 과거 기록도 살펴볼 수 있어요.</p></div><Link href="/draw/pattern-lab">패턴 연구실 가기 →</Link></section>
  </div>;
}
