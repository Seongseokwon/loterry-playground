import type { Metadata } from "next";
import { ModelPicks } from "@/components/draw/ModelPicks";
export const metadata: Metadata = { alternates: { canonical: "/draw/model-picks" }, title: "번호 탐험대", description: "네 가지 방식의 로또 번호 조합과 선택 이유를 비교해 보세요." };
export default function ModelPicksPage() { return <div className="page model-picks-page"><ModelPicks /></div>; }
