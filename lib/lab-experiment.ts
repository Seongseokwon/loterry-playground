import { drawNumbers } from "./draw-engine";
import { analyzeLab, type LabStrategy } from "./pattern-lab";
import { aggregateNumberStats } from "./stats";
import type { Draw, DrawConditions, DrawContext, DrawRequest } from "./types";

export interface LabConfig {
  pattern: boolean; strategy: LabStrategy; windowSize: number;
  hot: boolean; hotWindow: 0 | 10 | 30 | 50; hotWeight: "low" | "mid" | "high";
  cold: boolean; coldPool: 15 | 20 | 25;
  pair: boolean; pairWindow: 30 | 50 | 100; pairTop: number; pairBase: number | null;
}
export const experimentVariants = ["선택 조건", "무작위", "핫", "콜드", "핫 + 콜드", "궁합수"] as const;
export type Variant = typeof experimentVariants[number];
export function variantConfig(config: LabConfig, variant: Variant): LabConfig {
  if (variant === "선택 조건") return config;
  return { ...config, pattern: variant !== "무작위" && config.pattern,
    hot: variant === "핫" || variant === "핫 + 콜드", cold: variant === "콜드" || variant === "핫 + 콜드", pair: variant === "궁합수" };
}
export function labRequest(config: LabConfig, draws: Draw[], overridePattern?: DrawConditions["rangePattern"]): DrawRequest | null {
  const rangePattern = config.pattern ? overridePattern ?? analyzeLab(draws, config.strategy, config.windowSize).candidates[0]?.pattern : undefined;
  if (config.pattern && !rangePattern) return null;
  return { games: 1, conditions: { rangePattern, hot: config.hot ? { window: config.hotWindow, weight: config.hotWeight } : undefined,
    cold: config.cold ? { poolSize: config.coldPool } : undefined,
    pair: config.pair ? { base: config.pairBase ? [config.pairBase] : [], topK: config.pairTop, window: config.pairWindow } : undefined },
    filters: { noConsecutive3: false, noPastJackpot: false, noSameTail3: false } };
}
export function labContext(draws: Draw[]): DrawContext {
  const ordered = [...draws].sort((a, b) => b.round - a.round);
  return { stats: aggregateNumberStats(ordered), latestDraw: ordered[0], pastDraws: ordered };
}
export function sampleExperiment(request: DrawRequest, context: DrawContext, count: number, actual?: Draw) {
  const frequencies = Array<number>(45).fill(0);
  const matches = Array<number>(7).fill(0);
  const games: number[][] = [];
  let failed = 0;
  for (let i = 0; i < count; i += 1) {
    const game = drawNumbers(request, context).games[0];
    if (!game) { failed += 1; continue; }
    game.forEach((n) => { frequencies[n - 1] += 1; });
    if (actual) matches[game.filter((n) => actual.numbers.includes(n)).length] += 1;
    if (games.length < 5) games.push(game);
  }
  return { requested: count, completed: count - failed, failed, frequencies, matches, games };
}
export function backtestExperiments(draws: Draw[], config: LabConfig, rounds: number, samples: number) {
  const ordered = [...draws].sort((a, b) => a.round - b.round);
  const rows = experimentVariants.map((name) => ({ name, rounds: 0, skipped: 0, completed: 0, failed: 0, matches: Array<number>(7).fill(0) }));
  for (let i = Math.max(30, ordered.length - rounds); i < ordered.length; i += 1) {
    if (ordered[i].round !== ordered[i - 1].round + 1) continue;
    const history = ordered.slice(0, i).reverse();
    const context = labContext(history);
    rows.forEach((row) => {
      const request = labRequest(variantConfig(config, row.name), history);
      if (!request) { row.skipped += 1; return; }
      const result = sampleExperiment(request, context, samples, ordered[i]);
      row.rounds += 1; row.completed += result.completed; row.failed += result.failed;
      result.matches.forEach ( (value, index) => { row.matches[index] += value; });
    });
  }
  return rows;
}
