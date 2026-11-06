import type { Metadata } from "next";
import { PatternLab } from "@/components/draw/PatternLab";

export const metadata: Metadata = { alternates: { canonical: "/draw/pattern-lab" }, title: "패턴 연구실", description: "구간 패턴과 번호 통계를 비교하고 과거 회차로 실험해 보세요." };
export default function PatternLabPage() { return <div className="page page-narrow"><PatternLab /></div>; }
