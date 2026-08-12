import type { Metadata } from "next";
import { ArchivePanel } from "@/components/archive/ArchivePanel";

export const metadata: Metadata = { title: "보관함", description: "뽑아 둔 로또 번호를 저장하고 회차 결과를 확인하세요." };

export default function ArchivePage() {
  return (
    <div className="page page-narrow">
      <header className="page-header">
        <p className="eyebrow">내 번호 보관함</p>
        <h1>저장한 번호</h1>
        <p className="body-color">브라우저에만 안전하게 저장하고, 대상 회차가 확정되면 자동으로 등수를 알려드려요.</p>
      </header>
      <ArchivePanel />
    </div>
  );
}
