import { drawPattern, patternKey, type Pattern } from "./next-pattern";
import type { Draw } from "./types";

export type LabStrategy = "exact" | "similar" | "frequency";
export function patternDistance(a: Pattern, b: Pattern): number {
  return a.reduce((sum, value, index) => sum + Math.abs(value - b[index]), 0) / 2;
}

export function analyzeLab(draws: Draw[], strategy: LabStrategy, windowSize = Infinity) {
  const ordered = [...draws].sort((a, b) => b.round - a.round).slice(0, windowSize);
  if (!ordered.length) return { candidates: [] as { pattern: Pattern; count: number }[], examples: [] as { observed: Draw; next: Draw; distance: number }[] };
  const current = drawPattern(ordered[0]);
  const counts = new Map<string, { pattern: Pattern; count: number }>();
  const examples: { observed: Draw; next: Draw; distance: number }[] = [];
  const add = (pattern: Pattern) => {
    const key = patternKey(pattern);
    const entry = counts.get(key) ?? { pattern, count: 0 };
    entry.count += 1;
    counts.set(key, entry);
  };
  if (strategy === "frequency") ordered.forEach((draw) => add(drawPattern(draw)));
  else for (let i = 1; i < ordered.length; i += 1) {
    const observed = ordered[i];
    const next = ordered[i - 1];
    const distance = patternDistance(current, drawPattern(observed));
    if (next.round !== observed.round + 1 || distance > (strategy === "exact" ? 0 : 1)) continue;
    examples.push({ observed, next, distance });
    add(drawPattern(next));
  }
  return { candidates: [...counts.values()].sort((a, b) => b.count - a.count || patternKey(a.pattern).localeCompare(patternKey(b.pattern))), examples };
}

export function backtestLab(draws: Draw[], strategy: LabStrategy, windowSize: number, testCount = 100) {
  const ordered = [...draws].sort((a, b) => a.round - b.round);
  let tested = 0, hits = 0, top3 = 0, distance = 0;
  const start = Math.max(30, ordered.length - testCount);
  for (let i = start; i < ordered.length; i += 1) {
    if (ordered[i].round !== ordered[i - 1].round + 1) continue;
    const candidates = analyzeLab(ordered.slice(0, i), strategy, windowSize).candidates;
    if (!candidates.length) continue;
    const actual = drawPattern(ordered[i]);
    const key = patternKey(actual);
    tested += 1;
    if (patternKey(candidates[0].pattern) === key) hits += 1;
    if (candidates.slice(0, 3).some((item) => patternKey(item.pattern) === key)) top3 += 1;
    distance += patternDistance(candidates[0].pattern, actual);
  }
  return { tested, hits, top3, meanDistance: tested ? distance / tested : 0, requested: Math.max(0, ordered.length - start) };
}
