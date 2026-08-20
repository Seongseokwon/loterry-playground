import { lottoDraws } from "@/data/draws";
import { aggregateNumberStats } from "@/lib/stats";
import type { Draw, NumberStat } from "@/lib/types";

// 현재는 DB 없이 data/lotto-draws.json 스냅샷만 사용한다.
// 나중에 DB를 다시 붙일 때는 이 파일의 세 함수만 교체하면 된다.

export async function getDraws(): Promise<Draw[]> {
  return lottoDraws;
}

export async function getDrawByRound(round: number): Promise<Draw | null> {
  return lottoDraws.find((draw) => draw.round === round) ?? null;
}

export async function getNumberStats(): Promise<NumberStat[]> {
  return aggregateNumberStats(lottoDraws);
}
