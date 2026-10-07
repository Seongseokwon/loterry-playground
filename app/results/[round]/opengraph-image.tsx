import { ImageResponse } from "next/og";
import { getDrawByRound } from "@/lib/repositories/draws";

export const alt = "로또 플레이그라운드 회차 당첨번호";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage({ params }: { params: Promise<{ round: string }> }) {
  const { round } = await params;
  const draw = await getDrawByRound(Number(round));
  const title = draw ? `제${draw.round}회 당첨번호` : "로또 플레이그라운드";
  const numbers = draw ? `${draw.numbers.join("  ·  ")}  +  ${draw.bonus}` : "당첨번호와 통계를 한눈에";

  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: "72px", background: "#f7f7f4", color: "#18221d" }}>
      <div style={{ display: "flex", fontSize: 28, color: "#5f6c64", marginBottom: 24 }}>LOTTO PLAYGROUND</div>
      <div style={{ display: "flex", fontSize: 64, fontWeight: 700, letterSpacing: -2, marginBottom: 36 }}>{title}</div>
      <div style={{ display: "flex", fontSize: 42, fontWeight: 700, color: "#176b4d" }}>{numbers}</div>
      {draw && <div style={{ display: "flex", fontSize: 25, color: "#5f6c64", marginTop: 28 }}>{draw.date} · 보너스 번호는 마지막 숫자</div>}
      <div style={{ display: "flex", position: "absolute", right: 72, bottom: 48, fontSize: 22, color: "#5f6c64" }}>lotto-play-ground</div>
    </div>,
    { ...size },
  );
}
