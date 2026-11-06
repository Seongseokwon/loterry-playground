import type { Metadata } from "next";
import { CheckPanel } from "@/components/check/CheckPanel";

export const metadata: Metadata = { alternates: { canonical: "/check" }, title: "내 번호 조회", description: "로또 용지 QR을 읽거나 번호 6개를 입력해 당첨 결과를 확인하고, 용지에 없는 새 조합도 만들어 보세요." };
export default function CheckPage() { return <div className="page"><header className="page-header"><p className="eyebrow">QR 인식 또는 직접 입력</p><h1>내 번호 조회</h1><p className="body-color">로또 용지 QR을 읽거나 번호 6개를 직접 골라 선택한 회차와 비교하고, 용지에 없는 새 조합도 만들어 보세요.</p></header><CheckPanel /></div>; }
