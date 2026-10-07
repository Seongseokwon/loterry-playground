import type { LottoNumber } from "@/lib/types";

export interface TicketAnalysis {
  numbers: LottoNumber[];
  oddCount: number;
  evenCount: number;
  lowCount: number;
  highCount: number;
  birthdayCount: number;
  sum: number;
  span: number;
  consecutivePairs: number;
  maxSameTail: number;
  decadeCounts: number[];
  primaryLabel: string;
  labels: string[];
}

function countLargest(values: number[]) {
  return Math.max(...values, 0);
}

export function analyzeTicketNumbers(numbers: LottoNumber[]): TicketAnalysis | null {
  const sorted = [...new Set(numbers)].sort((left, right) => left - right);
  if (sorted.length !== 6 || sorted.some((number) => !Number.isInteger(number) || number < 1 || number > 45)) return null;

  const oddCount = sorted.filter((number) => number % 2 === 1).length;
  const lowCount = sorted.filter((number) => number <= 22).length;
  const birthdayCount = sorted.filter((number) => number <= 31).length;
  const tailCounts = Array.from({ length: 10 }, () => 0);
  const decadeCounts = [0, 0, 0, 0, 0];
  sorted.forEach((number) => {
    tailCounts[number % 10] += 1;
    decadeCounts[Math.min(Math.floor(number / 10), 4)] += 1;
  });
  const consecutivePairs = sorted.slice(1).filter((number, index) => number === sorted[index] + 1).length;
  const maxSameTail = countLargest(tailCounts);
  const labels: string[] = [];

  if (birthdayCount >= 5) labels.push("생일 번호 집중형");
  if (lowCount >= 4) labels.push("저번호 중심형");
  if (sorted.length - lowCount >= 4) labels.push("고번호 분산형");
  if (consecutivePairs >= 2) labels.push("연속 번호 모험형");
  if (maxSameTail >= 3) labels.push("끝수 반복형");
  if (countLargest(decadeCounts) >= 4) labels.push("구간 몰림형");
  if (oddCount === 3 && lowCount === 3 && birthdayCount <= 4 && consecutivePairs <= 1 && maxSameTail <= 2) labels.push("균형 분산형");
  if (labels.length === 0) labels.push("혼합형");

  return {
    numbers: sorted,
    oddCount,
    evenCount: sorted.length - oddCount,
    lowCount,
    highCount: sorted.length - lowCount,
    birthdayCount,
    sum: sorted.reduce((total, number) => total + number, 0),
    span: sorted[sorted.length - 1] - sorted[0],
    consecutivePairs,
    maxSameTail,
    decadeCounts,
    primaryLabel: labels[0],
    labels,
  };
}
