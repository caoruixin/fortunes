"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { usePathname } from "next/navigation";

import { BackendStatusBanner } from "@/components/backend-status-banner";
import { DEMO_MANHOLE_CODE, DEMO_MANHOLE_ID } from "@/lib/mock-data";
import { cn, formatDate } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", short: "总览" },
  { href: "/map", label: "Map", short: "地图" },
  { href: `/manholes/${DEMO_MANHOLE_ID}`, label: "Detail", short: "单井" },
  { href: `/manholes/${DEMO_MANHOLE_ID}/diagnosis`, label: "Diagnosis", short: "诊断" },
  { href: `/manholes/${DEMO_MANHOLE_ID}/plan`, label: "Plan", short: "方案" },
  { href: `/manholes/${DEMO_MANHOLE_ID}/simulation`, label: "Simulation", short: "施工" },
  { href: `/manholes/${DEMO_MANHOLE_ID}/acceptance`, label: "Acceptance", short: "验收" },
  { href: "/demo-script", label: "Demo Script", short: "路演" }
];

export function AppShell({
  children
}: {
  children: ReactNode;
  pathname?: string;
}) {
  const pathname = usePathname();

  function isActive(href: string) {
    if (!pathname) {
      return false;
    }
    if (href === `/manholes/${DEMO_MANHOLE_ID}`) {
      return pathname === href;
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <span className="brand-kicker">MVP Demo</span>
          <h1>井周智修</h1>
          <p>道路检查井井周病害 AI 诊修闭环</p>
        </div>
        <nav className="main-nav" aria-label="主导航">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn("nav-link", isActive(item.href) && "nav-link-active")}
            >
              <span>{item.short}</span>
              <strong>{item.label}</strong>
            </Link>
          ))}
        </nav>
      </aside>
      <div className="shell-main">
        <header className="topbar">
          <div>
            <span className="brand-kicker">Design Freeze to MVP</span>
            <p className="topbar-title">示范片区本地演示工作台</p>
          </div>
          <div className="topbar-meta">
            <div>
              <span className="meta-label">固定主井</span>
              <strong>
                {DEMO_MANHOLE_CODE} / {DEMO_MANHOLE_ID}
              </strong>
            </div>
            <div>
              <span className="meta-label">数据版本</span>
              <strong>Seed v1 / Mock AI</strong>
            </div>
            <div>
              <span className="meta-label">更新时间</span>
              <strong>{formatDate("2026-06-02T09:30:00+08:00")}</strong>
            </div>
          </div>
        </header>
        <main className="page-frame">
          <BackendStatusBanner />
          {children}
        </main>
      </div>
    </div>
  );
}
