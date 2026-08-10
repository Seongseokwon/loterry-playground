import { randomInt } from "./random";
import type { DrawContext, DrawRequest, DrawResult, LottoNumber, NumberStat } from "./types";

// TODO: W2에 실데이터로 튜닝
export const HOT_WEIGHT = { low: 1.3, mid: 2, high: 3 } as const;
const MAX_ATTEMPTS = 5000;
const ALL_NUMBERS = Array.from({ length: 45 }, (_, index) => index + 1);

function statValue(stat: NumberStat, window: 10 | 30 | 50 | 0) {
  if (window === 10) return stat.countRecent10;
  if (window === 50) return stat.countRecent50;
  if (window === 30) return stat.countRecent10 * 0.35 + stat.countRecent50 * 0.65;
  return stat.totalCount;
}

function weightedPick(pool: number[], weightFor: (number: number) => number): number {
  const weights = pool.map((number) => Math.max(1, Math.round(weightFor(number) * 1000)));
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  let cursor = randomInt(total);
  for (let index = 0; index < pool.length; index += 1) {
    cursor -= weights[index];
    if (cursor < 0) return pool[index];
  }
  return pool[pool.length - 1];
}

function hasConsecutive3(numbers: number[]) {
  return numbers.some((number, index) => index <= numbers.length - 3 && numbers[index + 1] === number + 1 && numbers[index + 2] === number + 2);
}

function maxTailCount(numbers: number[]) {
  const counts = new Map<number, number>();
  for (const number of numbers) counts.set(number % 10, (counts.get(number % 10) ?? 0) + 1);
  return Math.max(...counts.values());
}

function passesPatterns(numbers: number[], request: DrawRequest, pastKeys: Set<string>) {
  const { conditions, filters } = request;
  if (conditions.oddCount !== undefined && numbers.filter((number) => number % 2 === 1).length !== conditions.oddCount) return false;
  if (conditions.lowCount !== undefined && numbers.filter((number) => number <= 22).length !== conditions.lowCount) return false;
  if (conditions.sumRange && (numbers.reduce((sum, number) => sum + number, 0) < conditions.sumRange[0] || numbers.reduce((sum, number) => sum + number, 0) > conditions.sumRange[1])) return false;
  if (conditions.maxSameTail !== undefined && maxTailCount(numbers) > conditions.maxSameTail) return false;
  if (filters.noConsecutive3 && hasConsecutive3(numbers)) return false;
  if (filters.noSameTail3 && maxTailCount(numbers) >= 3) return false;
  if (filters.noPastJackpot && pastKeys.has(numbers.join(","))) return false;
  return true;
}

function chipLabels(request: DrawRequest) {
  const { conditions, filters } = request;
  const chips: string[] = [];
  if (conditions.fixed?.length) chips.push(`넣을 번호 ${conditions.fixed.join(", ")}`);
  if (conditions.excluded?.length) chips.push(`뺄 번호 ${conditions.excluded.length}개`);
  if (conditions.hot) chips.push(`핫넘버 · 최근 ${conditions.hot.window || "전체"}회 · ${conditions.hot.weight === "low" ? "약" : conditions.hot.weight === "mid" ? "중" : "강"}`);
  if (conditions.cold) chips.push(`미출현 · 상위 ${conditions.cold.poolSize}개`);
  if (conditions.carryover) chips.push(`이월수 ${conditions.carryover.count}개`);
  if (filters.noConsecutive3) chips.push("3연속 번호 제외");
  if (filters.noPastJackpot) chips.push("과거 1등 조합 제외");
  if (filters.noSameTail3) chips.push("같은 끝수 3개 제외");
  return chips.length ? chips : ["완전 랜덤"];
}

function relaxationSuggestions(request: DrawRequest) {
  const suggestions: string[] = [];
  if (request.conditions.excluded?.length) suggestions.push("뺄 번호 줄이기");
  if (request.conditions.fixed?.length) suggestions.push("넣을 번호 줄이기");
  if (request.conditions.carryover) suggestions.push("이월수 끄기");
  if (request.filters.noConsecutive3) suggestions.push("3연속 제외 끄기");
  if (request.filters.noSameTail3) suggestions.push("같은 끝수 필터 끄기");
  return suggestions.length ? suggestions : ["조건 초기화"];
}

export function drawNumbers(request: DrawRequest, context: DrawContext): DrawResult {
  const fixed = [...new Set(request.conditions.fixed ?? [])].filter((number) => Number.isInteger(number) && number >= 1 && number <= 45);
  const excluded = new Set((request.conditions.excluded ?? []).filter((number) => Number.isInteger(number) && number >= 1 && number <= 45));
  const relaxed: string[] = [];
  for (const number of fixed) {
    if (excluded.delete(number)) relaxed.push(`넣을 번호 ${number}을(를) 뺄 번호보다 우선했어요`);
  }
  const available = ALL_NUMBERS.filter((number) => !excluded.has(number));
  if (fixed.length > 5 || available.length < 6 || fixed.some((number) => !available.includes(number))) {
    return { games: [], appliedChips: chipLabels(request), attempts: 0, relaxed: [...relaxed, ...relaxationSuggestions(request)] };
  }

  const hotTop = new Set<number>();
  if (request.conditions.hot) {
    [...context.stats].sort((a, b) => statValue(b, request.conditions.hot!.window) - statValue(a, request.conditions.hot!.window)).slice(0, 15).forEach((stat) => hotTop.add(stat.number));
  }
  const coldTop = new Set([...context.stats].sort((a, b) => b.gap - a.gap).slice(0, request.conditions.cold?.poolSize ?? 0).map((stat) => stat.number));
  const weightFor = (number: number) => {
    let weight = 1;
    if (request.conditions.hot && hotTop.has(number)) weight *= HOT_WEIGHT[request.conditions.hot.weight];
    if (request.conditions.cold && coldTop.has(number)) weight *= 2;
    return weight;
  };

  const pastKeys = new Set(context.pastDraws.map((draw) => draw.numbers.join(",")));
  const gameKeys = new Set<string>();
  const games: LottoNumber[][] = [];
  let attempts = 0;

  while (games.length < request.games && attempts < MAX_ATTEMPTS) {
    attempts += 1;
    const selected = [...fixed];
    const carryTarget = request.conditions.carryover?.count ?? 0;
    const alreadyCarry = selected.filter((number) => context.latestDraw.numbers.includes(number)).length;
    const carryNeeded = Math.max(0, carryTarget - alreadyCarry);
    const carryPool = context.latestDraw.numbers.filter((number) => available.includes(number) && !selected.includes(number));
    if (carryPool.length < carryNeeded) continue;
    for (let i = 0; i < carryNeeded; i += 1) {
      const number = carryPool.splice(randomInt(carryPool.length), 1)[0];
      selected.push(number);
    }

    const pool = available.filter((number) => !selected.includes(number));
    while (selected.length < 6 && pool.length) {
      const number = weightedPick(pool, weightFor);
      selected.push(number);
      pool.splice(pool.indexOf(number), 1);
    }
    if (selected.length !== 6) continue;
    selected.sort((a, b) => a - b);
    const key = selected.join(",");
    if (gameKeys.has(key) || !passesPatterns(selected, request, pastKeys)) continue;
    gameKeys.add(key);
    games.push(selected);
  }

  if (games.length !== request.games) return { games: [], appliedChips: chipLabels(request), attempts, relaxed: [...relaxed, ...relaxationSuggestions(request)] };
  return { games, appliedChips: chipLabels(request), attempts, relaxed: relaxed.length ? relaxed : undefined };
}
