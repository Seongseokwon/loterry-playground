import type { Draw } from "@/lib/types";

export const NEXT_PATTERN_WINDOW = 100;
export const DEFAULT_NUMBER_RANGES = [
  [1, 10],
  [11, 20],
  [21, 30],
  [31, 40],
  [41, 45],
] as const;

export type Pattern = [number, number, number, number, number];

export interface NextPatternCandidate {
  pattern: Pattern;
  transitionCount: number;
  patternCount: number;
  latestTransitionRound: number;
}

export interface NextPatternAnalysis {
  currentPattern: Pattern;
  analyzedRounds: number;
  matchingRounds: number;
  candidates: NextPatternCandidate[];
}

export function drawPattern(draw: Draw): Pattern {
  const counts = DEFAULT_NUMBER_RANGES.map(([min, max]) => draw.numbers.filter((number) => number >= min && number <= max).length);
  return counts as Pattern;
}

export function patternKey(pattern: Pattern): string {
  return pattern.join(",");
}

export function formatPattern(pattern: Pattern): string {
  return pattern.join("·");
}

export function analyzeNextPatterns(draws: Draw[], windowSize = NEXT_PATTERN_WINDOW): NextPatternAnalysis {
  const ordered = [...draws].sort((a, b) => b.round - a.round);
  const windowDraws = ordered.slice(0, Math.max(1, windowSize));
  const currentPattern = drawPattern(windowDraws[0]);
  const counts = new Map<string, NextPatternCandidate>();
  let matchingRounds = 0;

  // Draws are newest-first, so the next draw for windowDraws[index] is index - 1.
  for (let index = 1; index < windowDraws.length; index += 1) {
    const observed = windowDraws[index];
    if (patternKey(drawPattern(observed)) !== patternKey(currentPattern)) continue;
    matchingRounds += 1;

    const nextDraw = windowDraws[index - 1];
    const nextPattern = drawPattern(nextDraw);
    const key = patternKey(nextPattern);
    const candidate = counts.get(key) ?? {
      pattern: nextPattern,
      transitionCount: 0,
      patternCount: 0,
      latestTransitionRound: nextDraw.round,
    };
    candidate.transitionCount += 1;
    candidate.patternCount += 1;
    candidate.latestTransitionRound = Math.max(candidate.latestTransitionRound, nextDraw.round);
    counts.set(key, candidate);
  }

  return {
    currentPattern,
    analyzedRounds: windowDraws.length,
    matchingRounds,
    candidates: [...counts.values()].sort((a, b) =>
      b.transitionCount - a.transitionCount || b.latestTransitionRound - a.latestTransitionRound || patternKey(a.pattern).localeCompare(patternKey(b.pattern))),
  };
}
