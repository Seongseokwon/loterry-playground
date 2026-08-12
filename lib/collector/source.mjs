const API_URL = "https://www.dhlottery.co.kr/lt645/selectPstLt645InfoNew.do";

export class CollectorResponseError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "CollectorResponseError";
    this.status = status;
  }
}

function parsePositiveInteger(value, name) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) throw new TypeError(`${name} must be a positive integer.`);
  return parsed;
}

function formatDate(value) {
  if (typeof value !== "string" || !/^\d{8}$/.test(value)) throw new TypeError("Invalid draw date.");
  return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;
}

function lottoNumber(value, field) {
  if (!Number.isInteger(value) || value < 1 || value > 45) throw new TypeError(`Invalid ${field}.`);
  return value;
}

export function normalizeApiRow(row) {
  if (!row || typeof row !== "object") throw new TypeError("Draw row is not an object.");
  const round = parsePositiveInteger(row.ltEpsd, "ltEpsd");
  const numbers = [row.tm1WnNo, row.tm2WnNo, row.tm3WnNo, row.tm4WnNo, row.tm5WnNo, row.tm6WnNo]
    .map((value, index) => lottoNumber(value, `tm${index + 1}WnNo`))
    .sort((a, b) => a - b);
  const bonus = lottoNumber(row.bnsWnNo, "bnsWnNo");
  if (new Set(numbers).size !== 6 || numbers.includes(bonus)) throw new TypeError(`Invalid number set for round ${round}.`);

  const draw = {
    round,
    date: formatDate(row.ltRflYmd),
    numbers,
    bonus,
    totalSell: Number(row.wholEpsdSumNtslAmt),
    firstWinAmount: Number(row.rnk1WnAmt),
    firstWinners: Number(row.rnk1WnNope),
  };
  for (const key of ["totalSell", "firstWinAmount", "firstWinners"]) {
    if (!Number.isFinite(draw[key]) || draw[key] < 0) throw new TypeError(`Invalid ${key} for round ${round}.`);
  }
  return draw;
}

export async function requestBatch(queryRound) {
  const url = new URL(API_URL);
  url.searchParams.set("srchDir", "center");
  url.searchParams.set("srchLtEpsd", String(queryRound));
  const response = await fetch(url, {
    headers: {
      Accept: "application/json,text/plain,*/*",
      Referer: "https://www.dhlottery.co.kr/lt645/result",
      "User-Agent": "lotto-play-ground/0.1 data-collector",
    },
    redirect: "error",
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) throw new CollectorResponseError(`HTTP ${response.status} ${response.statusText}`, response.status);
  if (!response.headers.get("content-type")?.includes("application/json")) throw new Error("Response is not JSON.");
  const payload = await response.json();
  if (!Array.isArray(payload?.data?.list)) throw new Error("Response does not contain data.list.");
  return payload.data.list.map(normalizeApiRow);
}

export { API_URL };
