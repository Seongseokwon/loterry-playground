import type { Metadata } from "next";
import "./globals.css";
import "../styles/components.css";
import "../styles/pages.css";
import "../styles/dashboard.css";
import "../styles/experience.css";
import { AppFooter, AppHeader } from "@/components/SiteChrome";
import { GoogleAnalytics } from "@/components/analytics/GoogleAnalytics";

const siteOrigin = process.env.NEXT_PUBLIC_SITE_URL ?? "https://lotto-play-ground.vercel.app";
const description = "이번 주 번호를 확인하고, 조건을 조합해 재미있게 번호를 골라보세요.";

export const metadata: Metadata = {
  metadataBase: new URL(siteOrigin),
  title: { default: "로또 플레이그라운드", template: "%s | 로또 플레이그라운드" },
  description,
  icons: { icon: "/lotto-logo.png", shortcut: "/lotto-logo.png" },
  openGraph: { title: "로또 플레이그라운드", description, type: "website", images: [{ url: "/og.jpg", width: 1200, height: 630, alt: "로또 플레이그라운드와 최신 당첨번호" }] },
  twitter: { card: "summary_large_image", title: "로또 플레이그라운드", description, images: ["/og.jpg"] },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>
        <GoogleAnalytics measurementId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID} />
        <a className="skip-link" href="#main-content">본문으로 건너뛰기</a>
        <AppHeader />
        <main id="main-content" className="site-main" tabIndex={-1}>{children}</main>
        <AppFooter />
      </body>
    </html>
  );
}
