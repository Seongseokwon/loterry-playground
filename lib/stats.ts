import type { Draw, NumberStat } from "./types";

export function aggregateNumberStats(draws: Draw[]): NumberStat[] {
  if (draws.length === 0) return [];
  const sorted = [...draws].sort((a, b) => b.round - a.round);
  const latestRound = sorted[0].round;
  return Array.from({ length: 45 }, (_, index) => {
    const number = index + 1;
    const appearances = sorted.filter((draw) => draw.numbers.includes(number));
    const lastSeenRound = appearances[0]?.round ?? 0;
    return {
      number,
      totalCount: appearances.length,
      lastSeenRound,
      gap: lastSeenRound ? latestRound - lastSeenRound : sorted.length,
      countRecent10: sorted.slice(0, 10).filter((draw) => draw.numbers.includes(number)).length,
      countRecent50: sorted.slice(0, 50).filter((draw) => draw.numbers.includes(number)).length,
      countRecent100: sorted.slice(0, 100).filter((draw) => draw.numbers.includes(number)).length,
    };
  });
}
