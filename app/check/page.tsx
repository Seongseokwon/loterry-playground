import type { Metadata } from "next";
import { CheckPanel } from "@/components/check/CheckPanel";

export const metadata: Metadata = { title: "내 번호 조회", description: "로또 용지를 촬영하거나 번호 6개를 입력해 조합 형태와 당첨 결과를 확인하세요." };
export default function CheckPage() { return <div className="page"><header className="page-header"><p className="eyebrow">수동 입력</p><h1>내 번호 조회</h1><p className="body-color">번호 6개를 고르면 선택한 회차와 바로 비교해요.</p></header><CheckPanel /></div>; }
