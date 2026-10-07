"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

type AnalyticsDetail = {
  name: string;
  properties: Record<string, boolean | number | string | undefined>;
};

const gaEventName: Record<string, string> = {
  result_shared: "share",
};

export function GoogleAnalytics({ measurementId }: { measurementId?: string }) {
  useEffect(() => {
    if (!measurementId) return;

    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || ((...args: unknown[]) => window.dataLayer.push(args));
    window.gtag("js", new Date());
    window.gtag("config", measurementId, { send_page_view: true });

    if (!document.querySelector(`script[data-lotto-ga="${measurementId}"]`)) {
      const script = document.createElement("script");
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
      script.dataset.lottoGa = measurementId;
      document.head.appendChild(script);
    }

    const handleAnalyticsEvent = (event: Event) => {
      const detail = (event as CustomEvent<AnalyticsDetail>).detail;
      if (!detail?.name || typeof window.gtag !== "function") return;

      const properties = Object.fromEntries(
        Object.entries(detail.properties ?? {}).filter(([, value]) => value !== undefined),
      );
      const eventName = gaEventName[detail.name] ?? detail.name;
      window.gtag("event", eventName, detail.name === "result_shared"
        ? { ...properties, content_type: "lottery_result" }
        : properties);
    };

    window.addEventListener("lotto:analytics", handleAnalyticsEvent);
    return () => window.removeEventListener("lotto:analytics", handleAnalyticsEvent);
  }, [measurementId]);

  if (!measurementId) return null;

  return null;
}
