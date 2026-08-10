export type LottoNumber = number;

export interface Draw {
  round: number;
  date: string;
  numbers: [LottoNumber, LottoNumber, LottoNumber, LottoNumber, LottoNumber, LottoNumber];
  bonus: LottoNumber;
  totalSell?: number;
  firstWinAmount?: number;
  firstWinners?: number;
}

export interface NumberStat {
  number: LottoNumber;
  totalCount: number;
  lastSeenRound: number;
  gap: number;
  countRecent10: number;
  countRecent50: number;
  countRecent100: number;
}

export interface DrawConditions {
  fixed?: LottoNumber[];
  excluded?: LottoNumber[];
  hot?: { window: 10 | 30 | 50 | 0; weight: "low" | "mid" | "high" };
  cold?: { poolSize: 15 | 20 | 25 };
  carryover?: { count: 1 | 2 };
  pair?: { base: LottoNumber[]; topK: number };
  birthday?: { dates: string[] };
  oddCount?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  lowCount?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  sumRange?: [number, number];
  maxSameTail?: 1 | 2;
}

export interface DrawRequest {
  conditions: DrawConditions;
  filters: { noConsecutive3: boolean; noPastJackpot: boolean; noSameTail3: boolean };
  games: 1 | 5;
  presetId?: string;
}

export interface DrawResult {
  games: LottoNumber[][];
  appliedChips: string[];
  attempts: number;
  relaxed?: string[];
}

export interface DrawContext {
  stats: NumberStat[];
  latestDraw: Draw;
  pastDraws: Draw[];
}
