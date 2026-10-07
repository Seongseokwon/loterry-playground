import { randomInt } from "@/lib/random";

export type CoverageWheelResult = {
  games: number[][];
  frequency: Record<string, number>;
  requestedGames: number;
  actualGames: number;
  minimumGames: number;
};

function shuffle(numbers: number[]) {
  const result = [...numbers];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInt(index + 1);
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

export function buildCoverageWheel(selectedNumbers: number[], requestedGames: number): CoverageWheelResult {
  const candidates = [...new Set(selectedNumbers)].filter((number) => Number.isInteger(number) && number >= 1 && number <= 45);
  if (candidates.length < 7) throw new RangeError("커버리지 휠링은 7개 이상의 후보 번호가 필요합니다.");

  const requested = Math.min(20, Math.max(1, Math.trunc(requestedGames) || 1));
  const minimumGames = Math.ceil(candidates.length / 6);
  const actualGames = Math.max(requested, minimumGames);
  const ordered = shuffle(candidates);
  const games = Array.from({ length: actualGames }, () => [] as number[]);
  const frequency = new Map<number, number>();

  ordered.forEach((number, index) => {
    games[index % actualGames].push(number);
    frequency.set(number, 1);
  });

  for (const game of games) {
    while (game.length < 6) {
      const candidate = [...candidates]
        .filter((number) => !game.includes(number))
        .sort((left, right) => (frequency.get(left) ?? 0) - (frequency.get(right) ?? 0))[0];
      if (candidate === undefined) break;
      game.push(candidate);
      frequency.set(candidate, (frequency.get(candidate) ?? 0) + 1);
    }
    game.sort((left, right) => left - right);
  }

  return {
    games,
    frequency: Object.fromEntries([...frequency.entries()].map(([number, count]) => [String(number), count])),
    requestedGames: requested,
    actualGames,
    minimumGames,
  };
}
