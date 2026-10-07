import type { MetadataRoute } from "next";
import { getDraws } from "@/lib/repositories/draws";

const siteOrigin = process.env.NEXT_PUBLIC_SITE_URL ?? "https://lotto-play-ground.vercel.app";
const INDEXABLE_ROUNDS = 30;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const draws = await getDraws();
  const latestDraw = draws[0];
  const roundEntries = draws.slice(0, INDEXABLE_ROUNDS).map((draw) => ({
    url: `${siteOrigin}/results/${draw.round}`,
    lastModified: new Date(`${draw.date}T12:00:00+09:00`),
    changeFrequency: "weekly" as const,
    priority: draw.round === latestDraw.round ? 1 : 0.8,
  }));

  return [
    { url: siteOrigin, changeFrequency: "weekly", priority: 1 },
    { url: `${siteOrigin}/results`, changeFrequency: "daily", priority: 0.9 },
    { url: `${siteOrigin}/draw`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${siteOrigin}/stats`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${siteOrigin}/check`, changeFrequency: "weekly", priority: 0.6 },
    ...roundEntries,
  ];
}
