import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { isPublishedDraw, requestBatch, validateDrawCollection } from "../lib/collector/source.mjs";

const PROJECT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUTPUT_PATH = resolve(PROJECT_ROOT, "data/lotto-draws.json");

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

async function writeJsonAtomic(path, value) {
  await mkdir(dirname(path), { recursive: true });
  const tempPath = `${path}.${process.pid}.tmp`;
  await writeFile(tempPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  await rename(tempPath, path);
}

async function main() {
  const existing = await readJson(OUTPUT_PATH);
  validateDrawCollection(existing);
  if (existing.some((draw) => !isPublishedDraw(draw))) throw new Error("Existing lotto data contains an unpublished future draw.");

  const existingByRound = new Map(existing.map((draw) => [draw.round, draw]));
  const latestStoredRound = Math.max(...existingByRound.keys());
  const received = (await requestBatch(latestStoredRound + 1)).filter((draw) => isPublishedDraw(draw));
  validateDrawCollection(received, { requireContiguous: false, allowEmpty: true });
  const latestAvailableRound = Math.max(latestStoredRound, ...received.map((draw) => draw.round));

  if (latestAvailableRound === latestStoredRound) {
    console.log(`No new draw available. Current round: ${latestStoredRound}.`);
    return;
  }

  for (let round = latestStoredRound + 1; round <= latestAvailableRound; round += 1) {
    const draw = received.find((item) => item.round === round);
    if (!draw) throw new Error(`Latest response did not include round ${round}.`);
    existingByRound.set(round, draw);
  }

  const normalized = Array.from(existingByRound.values()).sort((a, b) => b.round - a.round);
  validateDrawCollection(normalized);
  await writeJsonAtomic(OUTPUT_PATH, normalized);
  console.log(`Updated lotto data: ${latestStoredRound} -> ${latestAvailableRound} (${normalized.length} rounds).`);
}

await main();
