import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";
import "../styles/components.css";
import "../styles/pages.css";
import { AppFooter, AppHeader } from "@/components/SiteChrome";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("host") ?? "localhost:3000";
  const origin = `${host.startsWith("localhost") ? "http" : "https"}://${host}`;
  const description = "이번 주 번호를 확인하고, 조건을 조합해 재미있게 번호를 골라보세요.";
  return {
    title: { default: "로또 플레이그라운드", template: "%s | 로또 플레이그라운드" },
    description,
    icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
    openGraph: { title: "로또 플레이그라운드", description, type: "website", images: [{ url: `${origin}/og.png`, width: 1672, height: 941, alt: "로또 플레이그라운드와 제1236회 당첨번호" }] },
    twitter: { card: "summary_large_image", title: "로또 플레이그라운드", description, images: [`${origin}/og.png`] },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>
        <AppHeader />
        <main className="site-main">{children}</main>
        <AppFooter />
      </body>
    </html>
  );
}
