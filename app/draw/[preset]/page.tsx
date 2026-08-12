import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DrawBuilder } from "@/components/draw/DrawBuilder";
import { NextPatternPreview } from "@/components/draw/NextPatternPreview";

const presets = ["hot", "cold", "fixed", "carryover", "pair", "birthday", "next-pattern"] as const;
type Preset = (typeof presets)[number];
export function generateStaticParams() { return presets.map((preset) => ({ preset })); }
export async function generateMetadata({ params }: { params: Promise<{ preset: string }> }): Promise<Metadata> {
  const { preset } = await params;
  const titles: Record<string, string> = { hot: "핫넘버 추첨", cold: "미출현 번호 추첨", fixed: "내 번호 넣기", carryover: "이월수 추첨", pair: "궁합수 추첨", birthday: "기념일 번호 추첨", "next-pattern": "다음 패턴 추천" };
  return { title: titles[preset] ?? "번호 추첨" };
}
export default async function PresetDrawPage({ params }: { params: Promise<{ preset: string }> }) {
  const { preset } = await params;
  if (!presets.includes(preset as Preset)) notFound();
  if (preset === "next-pattern") return <div className="page page-narrow"><NextPatternPreview /></div>;
  return <div className="page page-narrow"><DrawBuilder preset={preset as Exclude<Preset, "next-pattern">} /></div>;
}
