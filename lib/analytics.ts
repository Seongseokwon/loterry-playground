export type AnalyticsEventName = "draw_started" | "draw_completed" | "draw_failed" | "draw_cancelled" | "set_saved" | "saved_result_viewed" | "result_shared" | "ticket_scan_started" | "ticket_scan_captured" | "ticket_scan_detected" | "ticket_scan_confirmed" | "ticket_scan_failed";
export type AnalyticsEventProperties = Record<string, boolean | number | string | undefined>;

export function trackEvent(name: AnalyticsEventName, properties: AnalyticsEventProperties = {}) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("lotto:analytics", { detail: { name, properties, occurredAt: new Date().toISOString() } }));
}

export function generationBucket(count: number) {
  if (count <= 1) return "1";
  if (count <= 10) return "2-10";
  if (count <= 100) return "11-100";
  if (count <= 10_000) return "101-10000";
  if (count <= 100_000) return "10001-100000";
  return "100001-1000000";
}
