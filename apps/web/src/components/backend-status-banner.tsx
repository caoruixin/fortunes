"use client";

import { useEffect, useState } from "react";

import { BACKEND_SERVICE_HINT } from "@/lib/api";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "");

export function BackendStatusBanner() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    let active = true;

    async function checkBackend() {
      if (!API_BASE) {
        if (active) {
          setShowBanner(true);
        }
        return;
      }

      try {
        const response = await fetch(`${API_BASE}/demo-script`, {
          cache: "no-store"
        });

        if (active) {
          setShowBanner(!response.ok);
        }
      } catch {
        if (active) {
          setShowBanner(true);
        }
      }
    }

    void checkBackend();

    return () => {
      active = false;
    };
  }, []);

  if (!showBanner) {
    return null;
  }

  return (
    <div className="backend-banner" role="status" aria-live="polite">
      <strong>{BACKEND_SERVICE_HINT}</strong>
      <span>当前页面会优先保留固定演示路径，等后端恢复后可自动切回 API 数据。</span>
    </div>
  );
}
