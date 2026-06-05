"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { usePathname } from "next/navigation";

import { BackendStatusBanner } from "@/components/backend-status-banner";
import { DEMO_MANHOLE_CODE, DEMO_MANHOLE_ID } from "@/lib/mock-data";
import { cn, formatDate } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "监测总览", short: "总览" },
  { href: "/map", label: "GIS态势", short: "态势" },
  { href: `/manholes/${DEMO_MANHOLE_ID}`, label: "一井一档", short: "档案" },
  { href: `/manholes/${DEMO_MANHOLE_ID}/diagnosis`, label: "AI研判", short: "研判" },
  { href: `/manholes/${DEMO_MANHOLE_ID}/plan`, label: "处置方案", short: "工单" },
  { href: `/manholes/${DEMO_MANHOLE_ID}/simulation`, label: "施工监管", short: "监管" },
  { href: `/manholes/${DEMO_MANHOLE_ID}/acceptance`, label: "验收归档", short: "归档" },
  { href: "/demo-script", label: "演示脚本", short: "讲解" }
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
          <div className="brand-mark-row">
            <span className="diting-logo" aria-hidden="true">
              <span />
            </span>
            <div>
              <span className="brand-kicker">Diting Platform</span>
              <h1>谛听</h1>
            </div>
          </div>
          <p>管井及周边道路智能监测管理平台</p>
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
            <span className="brand-kicker">Monitoring Command Center</span>
            <p className="topbar-title">城市管井隐患监测与处置指挥台</p>
          </div>
          <div className="topbar-meta">
            <div>
              <span className="meta-label">重点告警井</span>
              <strong>
                {DEMO_MANHOLE_CODE}
              </strong>
            </div>
            <div>
              <span className="meta-label">平台状态</span>
              <strong>多源感知 / AI研判</strong>
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
