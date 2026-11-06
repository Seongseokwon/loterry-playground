import type { Metadata } from "next";
import { ArchivePanel } from "@/components/archive/ArchivePanel";

export const metadata: Metadata = { title: "보관함", description: "선택하거나 뽑아 둔 로또 번호를 저장하고, 내 번호의 빈도와 조합을 분석하세요." };

export default function ArchivePage() {
  return (
    <div className="page page-narrow">
      <header className="page-header">
        <p className="eyebrow">내 번호 보관함</p>
        <h1>저장한 번호</h1>
        <p className="body-color">이 브라우저에 저장한 번호를 확인하고 빈도 분석과 조합 생성에 활용해 보세요.</p>
      </header>
      <ArchivePanel />
    </div>
  );
}
