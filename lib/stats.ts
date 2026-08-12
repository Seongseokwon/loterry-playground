import type { Draw, NumberStat, PairStat } from "./types";

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

/** Count co-occurrences among the six main numbers of each draw. */
export function pairStats(draws: Draw[]): PairStat[] {
  const counts = new Map<string, number>();

  for (let first = 1; first <= 45; first += 1) {
    for (let second = first + 1; second <= 45; second += 1) {
      counts.set(`${first},${second}`, 0);
    }
  }

  for (const draw of draws) {
    const numbers = [...new Set(draw.numbers.filter((number) => Number.isInteger(number) && number >= 1 && number <= 45))].sort((a, b) => a - b);
    for (let firstIndex = 0; firstIndex < numbers.length - 1; firstIndex += 1) {
      for (let secondIndex = firstIndex + 1; secondIndex < numbers.length; secondIndex += 1) {
        const key = `${numbers[firstIndex]},${numbers[secondIndex]}`;
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
    }
  }

  return [...counts.entries()]
    .map(([key, count]) => {
      const [first, second] = key.split(",").map(Number) as [number, number];
      return { numbers: [first, second], count } as PairStat;
    })
    .sort((a, b) => b.count - a.count || a.numbers[0] - b.numbers[0] || a.numbers[1] - b.numbers[1]);
}
