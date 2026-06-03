import type { Metadata } from "next";

import { AppShell } from "@/components/app-shell";

import "./globals.css";

export const metadata: Metadata = {
  title: "井周智修 MVP Demo",
  description: "道路检查井井周病害 AI 诊修本地演示前端",
  icons: {
    icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='10' fill='%231F2A33'/%3E%3Ccircle cx='32' cy='32' r='19' fill='none' stroke='%2322A6B3' stroke-width='6'/%3E%3Ccircle cx='32' cy='32' r='7' fill='%23F2A93B'/%3E%3C/svg%3E"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
