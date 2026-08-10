import { toDraw } from "@/lib/adapter";
import type { Draw } from "@/lib/types";

function seededRandom(seed = 1236) {
  let state = seed >>> 0;
  return (maxExclusive: number) => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return Math.floor((state / 0x100000000) * maxExclusive);
  };
}

export function generateMockDraws(): Draw[] {
  const nextInt = seededRandom();
  const anchor = Date.UTC(2026, 7, 8);
  const draws: Draw[] = [];
  for (let round = 1133; round <= 1236; round += 1) {
    const weeksAgo = 1236 - round;
    const date = new Date(anchor - weeksAgo * 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    if (round === 1236) {
      draws.push(toDraw({ round, date, numbers: [12, 18, 21, 29, 34, 38], bonus: 10, totalSell: 110_321_870_000, firstWinners: 11, firstWinAmount: 2_441_910_000 }));
      continue;
    }
    const pool = Array.from({ length: 45 }, (_, index) => index + 1);
    const picked: number[] = [];
    for (let i = 0; i < 7; i += 1) picked.push(pool.splice(nextInt(pool.length), 1)[0]);
    const numbers = picked.slice(0, 6).sort((a, b) => a - b);
    const firstWinners = 1 + nextInt(20);
    const totalSell = 90_000_000_000 + nextInt(30_000_000_001);
    const firstPool = Math.floor(totalSell * 0.24);
    draws.push(toDraw({ round, date, numbers, bonus: picked[6], totalSell, firstWinners, firstWinAmount: Math.floor(firstPool / firstWinners) }));
  }
  return draws.sort((a, b) => b.round - a.round);
}
