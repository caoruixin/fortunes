"use client";

import { useState } from "react";

import { createRepairPlan } from "@/lib/api";

export function CreatePlanButton({
  manholeId,
  diagnosisVersion
}: {
  manholeId: string;
  diagnosisVersion: string;
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
      await createRepairPlan(manholeId, diagnosisVersion);
      window.location.assign(`/manholes/${manholeId}/plan`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "处置方案生成失败");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="inline-action-stack">
      <button type="button" className="button button-secondary" onClick={() => void handleClick()} disabled={isSubmitting}>
        {isSubmitting ? "处置方案生成中…" : "下一步演示：生成处置方案"}
      </button>
      {error ? <p className="inline-action-error">{error}</p> : null}
    </div>
  );
}
