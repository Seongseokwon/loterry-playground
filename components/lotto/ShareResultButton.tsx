"use client";

import { useState } from "react";
import { trackEvent } from "@/lib/analytics";
import { ProductButton } from "@/components/ui/Button";

type ShareResultButtonProps = {
  round: number;
  numbers: number[];
  bonus: number;
};

export function ShareResultButton({ round, numbers, bonus }: ShareResultButtonProps) {
  const [status, setStatus] = useState<"idle" | "shared" | "copied">("idle");

  async function shareResult() {
    const url = new URL(`/results/${round}`, window.location.origin).toString();
    const text = `제${round}회 로또 당첨번호 ${numbers.join(", ")} + 보너스 ${bonus}번`;

    try {
      if (navigator.share) {
        await navigator.share({ title: `제${round}회 로또 당첨번호`, text, url });
        trackEvent("result_shared", { round, method: "web_share" });
        setStatus("shared");
        return;
      }

      await navigator.clipboard.writeText(`${text}\n${url}`);
      trackEvent("result_shared", { round, method: "clipboard" });
      setStatus("copied");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setStatus("idle");
    }
  }

  return (
    <ProductButton type="button" size="medium" tone="weak" onClick={shareResult}>
      {status === "shared" ? "공유했어요" : status === "copied" ? "링크를 복사했어요" : "이 회차 공유하기"}
    </ProductButton>
  );
}
