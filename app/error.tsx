"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="page page-narrow status-page">
      <div className="status-mark status-mark-error" aria-hidden="true">!</div>
      <div className="status-copy">
        <p className="eyebrow">잠시 문제가 생겼어요</p>
        <h1>화면을 불러오지 못했어요</h1>
        <p className="body-color">잠시 후 다시 시도해 주세요. 같은 문제가 계속되면 홈으로 돌아갈 수 있어요.</p>
      </div>
      <div className="status-actions">
        <button className="product-button product-large product-primary" type="button" onClick={reset}>다시 시도</button>
        <Link className="product-button product-large product-weak" href="/">홈으로 돌아가기</Link>
      </div>
    </div>
  );
}
