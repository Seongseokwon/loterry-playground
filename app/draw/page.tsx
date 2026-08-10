import type { Metadata } from "next";
import { DrawBuilder } from "@/components/draw/DrawBuilder";

export const metadata: Metadata = { title: "번호 추첨", description: "조건을 조합하거나 완전 랜덤으로 로또 번호를 골라보세요." };

export default function DrawPage() { return <div className="page page-narrow"><DrawBuilder /></div>; }
