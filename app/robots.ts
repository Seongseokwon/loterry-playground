import type { MetadataRoute } from "next";

const siteOrigin = process.env.NEXT_PUBLIC_SITE_URL ?? "https://lotto-play-ground.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/archive"] },
    sitemap: `${siteOrigin}/sitemap.xml`,
  };
}
