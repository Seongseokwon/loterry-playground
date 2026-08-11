"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", icon: "home", label: "홈" },
  { href: "/results", icon: "trophy", label: "당첨번호" },
  { href: "/draw", icon: "dice", label: "추첨" },
  { href: "/stats", icon: "chart", label: "통계" },
  { href: "/check", icon: "ticket", label: "내 번호" },
];

export function AppHeader() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link className="brand" href="/" aria-label="로또 플레이그라운드 홈">
          <span className="brand-mark" aria-hidden="true">6</span>
          <span>로또 플레이그라운드</span>
        </Link>
        <nav className="desktop-nav" aria-label="주요 메뉴">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={isActive(item.href) ? "nav-active" : undefined}
              aria-current={isActive(item.href) ? "page" : undefined}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
      <nav className="mobile-nav" aria-label="모바일 주요 메뉴">
        {navItems.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className={isActive(item.href) ? "nav-active" : undefined}
            aria-current={isActive(item.href) ? "page" : undefined}
          >
            <span
              className="mobile-nav-icon"
              style={{ backgroundImage: `url(/icons/footer-${item.icon}.png)` }}
              aria-hidden="true"
            />
            <small>{item.label}</small>
          </a>
        ))}
      </nav>
    </header>
  );
}

export function AppFooter() {
  return (
    <footer className="site-footer">
      <div>
        <p>본 사이트는 동행복권 및 기획재정부와 무관한 비공식 정보 서비스입니다.</p>
        <p>제공되는 모든 번호 추첨과 통계는 재미를 위한 것이며, 당첨 확률에 영향을 주지 않습니다.</p>
        <p>만 19세 미만은 복권을 구매할 수 없습니다.</p>
        <p>도박 문제로 어려움을 겪고 계신가요? 한국도박문제예방치유원 ☎ 1336</p>
      </div>
    </footer>
  );
}
