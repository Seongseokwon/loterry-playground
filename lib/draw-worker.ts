import { drawNumbers } from "./draw-engine";
import type { DrawContext, DrawRequest, DrawResult } from "./types";

interface DrawWorkerInput {
  request: DrawRequest;
  context: DrawContext;
  total: number;
  keepLastOnly: boolean;
}

interface DrawWorkerProgress {
  type: "progress";
  current: number;
  total: number;
}

interface DrawWorkerComplete {
  type: "complete";
  result: DrawResult | null;
}

interface DrawWorkerScope {
  onmessage: (event: MessageEvent<DrawWorkerInput>) => void;
  postMessage: (message: DrawWorkerProgress | DrawWorkerComplete) => void;
}

const workerScope = self as unknown as DrawWorkerScope;

workerScope.onmessage = ({ data }) => {
  const generated: DrawResult[] = [];
  let lastGenerated: DrawResult | null = null;
  const progressStep = Math.max(10, Math.ceil(data.total / 100));

  for (let index = 0; index < data.total; index += 1) {
    const next = drawNumbers(data.request, data.context);
    lastGenerated = next;
    if (!data.keepLastOnly) generated.push(next);

    if (index === data.total - 1 || index % progressStep === 0) {
      workerScope.postMessage({ type: "progress", current: index + 1, total: data.total });
    }
  }

  const results = data.keepLastOnly && lastGenerated ? [lastGenerated] : generated;
  const first = results[0];
  workerScope.postMessage({
    type: "complete",
    result: first ? {
      games: results.flatMap((item) => item.games),
      appliedChips: first.appliedChips,
      attempts: results.reduce((totalAttempts, item) => totalAttempts + item.attempts, 0),
      relaxed: [...new Set(results.flatMap((item) => item.relaxed ?? []))],
    } : null,
  });
};
