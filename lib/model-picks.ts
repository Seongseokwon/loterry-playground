import { aggregateNumberStats, pairStats } from "./stats";
import type { Draw } from "./types";

export type ModelId = "random" | "trend" | "gap" | "pair";
export interface ModelPick { id: ModelId; name: string; numbers: number[]; explanation: string; }

/** Weighted sampling without replacement; weights describe a choice, not a probability forecast. */
function sample(weights: number[], count: number, rng: () => number): number[] {
  const pool = weights.map((weight, i) => ({ number: i + 1, weight }));
  const chosen: number[] = [];
  while (chosen.length < count) {
    const total = pool.reduce((sum, item) => sum + item.weight, 0);
    let value = rng() * total;
    let index = pool.findIndex((item) => { value -= item.weight; return value < 0; });
    if (index < 0) index = pool.length - 1;
    chosen.push(pool.splice(index, 1)[0].number);
  }
  return chosen.sort((a, b) => a - b);
}

export function recommendModels(draws: Draw[], rng: () => number = Math.random): ModelPick[] {
  if (!draws.length) return [];
  const ordered = [...draws].sort((a, b) => b.round - a.round);
  const recent = ordered.slice(0, 30);
  const stats = aggregateNumberStats(ordered);
  const uniform = Array<number>(45).fill(1);
  const random = sample(uniform, 6, rng);
  const trend = sample(stats.map((s) => 1 + s.countRecent30), 6, rng);
  const gap = sample(stats.map((s) => 1 + Math.min(s.gap, 30) / 5), 6, rng);
  const pairs = pairStats(recent).filter((pair) => pair.count > 0).slice(0, 20);
  const pair = pairs.length ? pairs[Math.min(Math.floor(rng() * pairs.length), pairs.length - 1)] : undefined;
  const restWeights = uniform.map((weight, i) => pair?.numbers.includes(i + 1) ? 0 : weight);
  const pairNumbers = pair ? [...pair.numbers, ...sample(restWeights, 4, rng)].sort((a, b) => a - b) : sample(uniform, 6, rng);
  const counts = trend.map((n) => `${n}번 ${stats[n - 1].countRecent30}회`).join(" · ");
  const gaps = gap.map((n) => `${n}번 ${stats[n - 1].gap}회`).join(" · ");
  return [
    { id: "random", name: "랜덤 탐험가", numbers: random, explanation: "모든 번호에 같은 선택 기회를 주고 중복 없이 6개를 골랐어요." },
    { id: "trend", name: "최근 흐름 탐험가", numbers: trend, explanation: `최근 ${recent.length}회 출현 횟수가 많을수록 더 자주 선택하도록 했어요. 선택 번호의 출현 횟수: ${counts}` },
    { id: "gap", name: "오래 쉰 번호 탐험가", numbers: gap, explanation: `오래 나오지 않은 번호에 더 큰 가중치를 주었어요(30회까지만 반영). 선택 번호의 미출현 간격: ${gaps}` },
    { id: "pair", name: "단짝 번호 탐험가", numbers: pairNumbers, explanation: pair ? `최근 ${recent.length}회에 ${pair.count}번 함께 나온 ${pair.numbers.join("·")}을 포함하고 나머지는 무작위로 골랐어요. 상위 20개 쌍 중 하나를 선택합니다.` : "함께 나온 번호 사례가 없어 무작위로 골랐어요." },
  ];
}
