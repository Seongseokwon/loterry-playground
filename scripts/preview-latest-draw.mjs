const API_URL = "https://www.dhlottery.co.kr/lt645/selectPstLt645InfoNew.do";
const DRAW_START_DATE = new Date("2002-12-07T00:00:00+09:00");
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const DEFAULT_MAX_ATTEMPTS = 12;

function parsePositiveInteger(value, name) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) throw new TypeError(`${name} must be a positive integer.`);
  return parsed;
}

function parseArguments(argv) {
  const values = new Map(
    argv.filter((value) => value.startsWith("--") && value.includes("="))
      .map((value) => value.slice(2).split(/=(.*)/s, 2)),
  );
  return {
    round: values.has("round") ? parsePositiveInteger(values.get("round"), "round") : null,
    maxAttempts: values.has("max-attempts") ? parsePositiveInteger(values.get("max-attempts"), "max-attempts") : DEFAULT_MAX_ATTEMPTS,
  };
}

function estimatedRound(now = new Date()) {
  return Math.max(1, Math.floor((now.getTime() - DRAW_START_DATE.getTime()) / WEEK_MS) + 1);
}

function todayInKorea() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(new Date());
}

function isValidDraw(draw, today) {
  return Number.isInteger(draw?.ltEpsd)
    && typeof draw.ltRflYmd === "string"
    && /^\d{8}$/.test(draw.ltRflYmd)
    && `${draw.ltRflYmd.slice(0, 4)}-${draw.ltRflYmd.slice(4, 6)}-${draw.ltRflYmd.slice(6, 8)}` <= today
    && [draw.tm1WnNo, draw.tm2WnNo, draw.tm3WnNo, draw.tm4WnNo, draw.tm5WnNo, draw.tm6WnNo, draw.bnsWnNo]
      .every((number) => Number.isInteger(number) && number >= 1 && number <= 45);
}

async function requestBatch(round) {
  const url = new URL(API_URL);
  url.searchParams.set("srchDir", "center");
  url.searchParams.set("srchLtEpsd", String(round));
  const response = await fetch(url, {
    headers: { Accept: "application/json,text/plain,*/*", Referer: "https://www.dhlottery.co.kr/lt645/result" },
    redirect: "error",
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`);
  const payload = await response.json();
  if (!Array.isArray(payload?.data?.list)) throw new Error("Response does not contain data.list.");
  return payload.data.list;
}

function printDraw(draw) {
  const numbers = [draw.tm1WnNo, draw.tm2WnNo, draw.tm3WnNo, draw.tm4WnNo, draw.tm5WnNo, draw.tm6WnNo].sort((a, b) => a - b);
  console.log(`Latest confirmed draw: ${draw.ltEpsd} (${draw.ltRflYmd.slice(0, 4)}-${draw.ltRflYmd.slice(4, 6)}-${draw.ltRflYmd.slice(6, 8)})`);
  console.log(`Numbers: ${numbers.join(", ")} + Bonus: ${draw.bnsWnNo}`);
  console.log(`First prize winners: ${draw.rnk1WnNope ?? "unknown"}`);
  console.log(`First prize amount: ${draw.rnk1WnAmt ?? "unknown"}`);
  console.log("No project files were read or changed.");
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  const today = todayInKorea();
  const startingRound = options.round ?? estimatedRound();

  if (options.round !== null) {
    const draws = (await requestBatch(options.round)).filter((draw) => isValidDraw(draw, today));
    const requested = draws.find((draw) => draw.ltEpsd === options.round);
    if (!requested) {
      throw new Error(`제${options.round}회 당첨번호를 아직 확인할 수 없습니다. 아직 추첨되지 않았거나 조회 결과가 없습니다.`);
    }
    printDraw(requested);
    return;
  }

  for (let offset = 0; offset < options.maxAttempts; offset += 1) {
    const queryRound = Math.max(1, startingRound - offset);
    console.log(`Requesting around round ${queryRound}...`);
    const draws = (await requestBatch(queryRound)).filter((draw) => isValidDraw(draw, today));
    const latest = draws.sort((left, right) => right.ltEpsd - left.ltEpsd)[0];
    if (latest) {
      printDraw(latest);
      return;
    }
  }

  throw new Error(`No confirmed draw found after ${options.maxAttempts} attempts. Try --round=<known round>.`);
}

try {
  await main();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`조회할 수 없습니다: ${message}`);
  process.exitCode = 1;
}
