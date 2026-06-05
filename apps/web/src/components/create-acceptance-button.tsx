"use client";

import { useState } from "react";

import { createAcceptance } from "@/lib/api";

export function CreateAcceptanceButton({
  manholeId,
  planVersion
}: {
  manholeId: string;
  planVersion: string;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await createAcceptance(manholeId, planVersion);
      window.location.assign(`/manholes/${manholeId}/acceptance`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "验收档案生成失败");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="inline-action-stack">
      <button type="button" className="button button-primary" onClick={() => void handleClick()} disabled={isSubmitting}>
        {isSubmitting ? "验收档案生成中…" : "下一步演示：生成验收档案"}
      </button>
      {error ? <p className="inline-action-error">{error}</p> : null}
    </div>
  );
}
