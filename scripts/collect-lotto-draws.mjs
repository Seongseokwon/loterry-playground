import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const API_URL = "https://www.dhlottery.co.kr/lt645/selectPstLt645InfoNew.do";
const DEFAULT_INTERVAL_MS = 15_000;
const DEFAULT_TARGET_ROUND = 1236;
const PROJECT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

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
    selfTest: argv.includes("--self-test"),
    targetRound: values.has("target") ? parsePositiveInteger(values.get("target"), "target") : DEFAULT_TARGET_ROUND,
    intervalMs: values.has("interval-ms") ? parsePositiveInteger(values.get("interval-ms"), "interval-ms") : DEFAULT_INTERVAL_MS,
    initialDelayMs: values.has("initial-delay-ms") ? Number(values.get("initial-delay-ms")) : 0,
    outputPath: resolve(PROJECT_ROOT, values.get("output") ?? "data/lotto-draws.json"),
    statePath: resolve(PROJECT_ROOT, values.get("state") ?? "data/collection-state.json"),
  };
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

function nextQueryRound(drawsByRound, targetRound) {
  for (let round = 1; round <= targetRound; round += 1) {
    if (!drawsByRound.has(round)) {
      // The API returns a 10-round window centered near the requested round.
      // Request 1 at the lower boundary, then place the first missing round at
      // the lower edge of subsequent windows.
      return round === 1 ? 1 : Math.min(targetRound, round + 5);
    }
  }
  return null;
}

async function readJson(path, fallback) {
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch (error) {
    if (error?.code === "ENOENT") return fallback;
    throw error;
  }
}

async function writeJsonAtomic(path, value) {
  await mkdir(dirname(path), { recursive: true });
  const tempPath = `${path}.${process.pid}.tmp`;
  await writeFile(tempPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  await rename(tempPath, path);
}

function delay(ms) {
  return new Promise((resolveDelay) => setTimeout(resolveDelay, ms));
}

async function requestBatch(queryRound) {
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
  if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`);
  if (!response.headers.get("content-type")?.includes("application/json")) throw new Error("Response is not JSON.");
  const payload = await response.json();
  if (!Array.isArray(payload?.data?.list)) throw new Error("Response does not contain data.list.");
  return payload.data.list.map(normalizeApiRow);
}

function runSelfTest() {
  const draw = normalizeApiRow({
    ltEpsd: 1236, ltRflYmd: "20260808", tm1WnNo: 12, tm2WnNo: 18, tm3WnNo: 21,
    tm4WnNo: 29, tm5WnNo: 34, tm6WnNo: 38, bnsWnNo: 10, wholEpsdSumNtslAmt: 114070835000,
    rnk1WnAmt: 2441919375, rnk1WnNope: 11,
  });
  if (draw.round !== 1236 || draw.date !== "2026-08-08" || draw.numbers.join(",") !== "12,18,21,29,34,38") {
    throw new Error("Collector self-test failed.");
  }
  console.log("Collector self-test passed.");
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.selfTest) return runSelfTest();
  if (!Number.isFinite(options.initialDelayMs) || options.initialDelayMs < 0) throw new TypeError("initial-delay-ms must be zero or greater.");

  const existingDraws = await readJson(options.outputPath, []);
  if (!Array.isArray(existingDraws)) throw new TypeError("Existing output is not an array.");
  const drawsByRound = new Map(existingDraws.map((draw) => [draw.round, draw]));
  let lastRequestStartedAt = 0;
  let stopping = false;

  const saveState = async (status, extra = {}) => writeJsonAtomic(options.statePath, {
    status,
    source: API_URL,
    targetRound: options.targetRound,
    intervalMs: options.intervalMs,
    collected: Array.from(drawsByRound.keys()).filter((round) => round >= 1 && round <= options.targetRound).length,
    updatedAt: new Date().toISOString(),
    ...extra,
  });

  const stop = async (signal) => {
    if (stopping) return;
    stopping = true;
    await saveState("stopped", { reason: `Received ${signal}.` });
    process.exitCode = 130;
  };
  process.once("SIGINT", () => void stop("SIGINT"));
  process.once("SIGTERM", () => void stop("SIGTERM"));

  if (options.initialDelayMs > 0) {
    console.log(`Initial safety delay: ${options.initialDelayMs}ms`);
    await delay(options.initialDelayMs);
  }

  try {
    let queryRound = nextQueryRound(drawsByRound, options.targetRound);
    while (queryRound !== null && !stopping) {
      const missingBefore = Array.from({ length: options.targetRound }, (_, index) => index + 1)
        .find((round) => !drawsByRound.has(round));
      const elapsed = Date.now() - lastRequestStartedAt;
      if (lastRequestStartedAt > 0 && elapsed < options.intervalMs) await delay(options.intervalMs - elapsed);
      lastRequestStartedAt = Date.now();
      await saveState("running", { requestingRound: queryRound, firstMissingRound: missingBefore, lastRequestAt: new Date(lastRequestStartedAt).toISOString() });
      const draws = await requestBatch(queryRound);
      const received = new Set(draws.map((draw) => draw.round));
      if (missingBefore !== undefined && !received.has(missingBefore)) {
        throw new Error(`Response for ${queryRound} did not include first missing round ${missingBefore}.`);
      }

      for (const draw of draws) {
        if (draw.round >= 1 && draw.round <= options.targetRound) drawsByRound.set(draw.round, draw);
      }
      const normalized = Array.from(drawsByRound.values())
        .filter((draw) => draw.round >= 1 && draw.round <= options.targetRound)
        .sort((a, b) => b.round - a.round);
      await writeJsonAtomic(options.outputPath, normalized);
      console.log(`[${new Date().toISOString()}] ${normalized.length}/${options.targetRound} rounds saved (request ${queryRound}).`);
      queryRound = nextQueryRound(drawsByRound, options.targetRound);
    }

    if (!stopping) {
      await saveState("completed", { completedAt: new Date().toISOString() });
      console.log(`Collection complete: ${options.targetRound} rounds.`);
    }
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    await saveState("stopped", { reason, failedAt: new Date().toISOString() });
    console.error(`Collection stopped: ${reason}`);
    process.exitCode = 1;
  }
}

await main();
