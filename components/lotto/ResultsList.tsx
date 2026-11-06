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
  const [query, setQuery] = useState("");
  const filtered = query ? draws.filter((draw) => String(draw.round).includes(query)) : draws;
  const visibleDraws = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;
  const remainingCount = filtered.length - visibleCount;

  return (
    <>
      <div className="results-search"><label htmlFor="round-search">회차 검색</label><input id="round-search" type="search" inputMode="numeric" placeholder="예: 1248" value={query} onChange={(event) => { setQuery(event.target.value.replace(/\D/g, "")); setVisibleCount(PAGE_SIZE); }} /><p className="body-small" role="status">{query ? `검색 결과 ${filtered.length.toLocaleString("ko-KR")}회` : "찾고 싶은 회차 번호를 입력해 주세요."}</p></div>
      {filtered.length === 0 && <div className="card results-empty"><p>해당 회차를 찾지 못했어요. 다른 번호로 검색해 보세요.</p></div>}
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
            onClick={() => setVisibleCount((count) => Math.min(count + PAGE_SIZE, filtered.length))}
            aria-label={`당첨번호 ${Math.min(PAGE_SIZE, remainingCount)}개 더보기`}
          >
            더보기
          </ProductButton>
          <span className="body-small">전체 {filtered.length.toLocaleString("ko-KR")}회 중 {visibleCount.toLocaleString("ko-KR")}회 표시</span>
        </div>
      )}
    </>
  );
}
