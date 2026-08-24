import type { LottoNumber } from "./types";
import type { SavedSet, SavedSetNumbers } from "./storage";

export interface SavedNumberStat {
  number: LottoNumber;
  count: number;
  percentage: number;
}

export interface SavedSetsAnalysis {
  totalSets: number;
  totalSelections: number;
  numbers: SavedNumberStat[];
  topNumbers: SavedNumberStat[];
}

function countNumbers(sets: SavedSet[]) {
  const counts = new Map<LottoNumber, number>();
  for (let number = 1; number <= 45; number += 1) counts.set(number, 0);

  for (const set of sets) {
    for (const number of set.numbers) counts.set(number, (counts.get(number) ?? 0) + 1);
  }

  return counts;
}

export function analyzeSavedSets(sets: SavedSet[]): SavedSetsAnalysis {
  const counts = countNumbers(sets);
  const totalSets = sets.length;
  const totalSelections = totalSets * 6;
  const numbers = Array.from(counts, ([number, count]) => ({
    number,
    count,
    percentage: totalSets === 0 ? 0 : Math.round((count / totalSets) * 1000) / 10,
  }));
  const topCount = numbers.reduce((max, item) => Math.max(max, item.count), 0);
  const topNumbers = topCount === 0 ? [] : numbers.filter((item) => item.count === topCount);

  return { totalSets, totalSelections, numbers, topNumbers };
}

export function generateWeightedCombination(sets: SavedSet[], random: () => number = Math.random): SavedSetNumbers {
  if (sets.length === 0) throw new TypeError("저장된 번호가 없습니다.");

  const counts = countNumbers(sets);
  const pool = Array.from({ length: 45 }, (_, index) => index + 1);
  const selected: number[] = [];

  while (selected.length < 6) {
    const totalWeight = pool.reduce((sum, number) => sum + (counts.get(number) ?? 0) + 1, 0);
    const randomPoint = Math.min(0.999999999, Math.max(0, random())) * totalWeight;
    let cursor = 0;
    let selectedIndex = pool.length - 1;

    for (let index = 0; index < pool.length; index += 1) {
      cursor += (counts.get(pool[index]) ?? 0) + 1;
      if (randomPoint < cursor) {
        selectedIndex = index;
        break;
      }
    }

    selected.push(pool[selectedIndex]);
    pool.splice(selectedIndex, 1);
  }

  return selected.sort((a, b) => a - b) as SavedSetNumbers;
}
