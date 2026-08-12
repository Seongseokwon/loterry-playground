"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { BallRow } from "@/components/lotto/BallRow";
import { ProductButton } from "@/components/ui/Button";
import { formatWon } from "@/lib/format";
import type { Draw } from "@/lib/types";

const PAGE_SIZE = 25;

export function ResultsList({ draws }: { draws: Draw[] }) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const visibleDraws = draws.slice(0, visibleCount);
  const hasMore = visibleCount < draws.length;
  const remainingCount = draws.length - visibleCount;

  return (
    <>
      <div className="result-list">
        {visibleDraws.map((draw, index) => (
          <Link className="result-row" href={`/results/${draw.round}`} key={draw.round}>
            <div className="result-row-head"><div><strong>제{draw.round}회</strong><span>{draw.date}</span></div>{index === 0 && <Image className="latest-draw-icon" src="/icons/latest-draw.png" alt="최신 회차" title="최신 회차" width={42} height={42} priority />}</div>
            <BallRow draw={draw} size="sm" />
            <div className="result-row-meta"><span>1등 {draw.firstWinners}명</span><span>{formatWon(draw.firstWinAmount)}</span></div>
          </Link>
        ))}
      </div>
      {hasMore && (
        <div className="result-list-actions">
          <ProductButton
            size="large"
            tone="weak"
            type="button"
            onClick={() => setVisibleCount((count) => Math.min(count + PAGE_SIZE, draws.length))}
            aria-label={`당첨번호 ${Math.min(PAGE_SIZE, remainingCount)}개 더보기`}
          >
            더보기
          </ProductButton>
          <span className="body-small">전체 {draws.length.toLocaleString("ko-KR")}회 중 {visibleCount.toLocaleString("ko-KR")}회 표시</span>
        </div>
      )}
    </>
  );
}
