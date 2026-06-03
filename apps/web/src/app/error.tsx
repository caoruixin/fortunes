"use client";

import { BACKEND_SERVICE_HINT } from "@/lib/api";
import { ActionLink, ErrorState } from "@/components/ui";

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const isBackendIssue =
    error.message.includes("fetch") ||
    error.message.includes("API") ||
    error.message.includes("NEXT_PUBLIC_API_BASE_URL") ||
    error.message.includes("后端服务");

  return (
    <ErrorState
      title="页面加载失败"
      description={isBackendIssue ? BACKEND_SERVICE_HINT : "页面数据暂时不可用，请重试当前步骤或返回固定演示路径起点。"}
      action={
        <div className="page-actions-inline">
          <button type="button" className="button button-primary" onClick={() => reset()}>
            重试当前页面
          </button>
          <ActionLink href="/dashboard" variant="secondary">
            返回总览
          </ActionLink>
        </div>
      }
    />
  );
}
