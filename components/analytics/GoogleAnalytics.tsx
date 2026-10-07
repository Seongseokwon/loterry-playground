"use client";

import Script from "next/script";
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

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`} strategy="afterInteractive" />
      <Script id="google-analytics" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
window.gtag = function(){ window.dataLayer.push(arguments); };
window.gtag('js', new Date());
window.gtag('config', '${measurementId}', { send_page_view: true });`}
      </Script>
    </>
  );
}
