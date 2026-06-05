"use client";

import { startTransition, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

import { CreatePlanButton } from "@/components/create-plan-button";
import { createDiagnosis } from "@/lib/api";
import { Diagnosis, ManholeDetail } from "@/lib/types";
import { DiagnosisVisual } from "@/components/diagnosis-visual";
import { DataList, ErrorState, Panel, SectionTitle, StagePill } from "@/components/ui";
import { getDiseaseLabel } from "@/lib/mock-data";

const progressMessages = [
  "正在融合井盖传感、巡检影像与历史工单…",
  "正在解析雷达异常反射与深度分层…",
  "正在匹配盖座声振、沉陷指标与维修记录…",
  "正在生成 AI 风险研判结果与处置建议…"
];

export function DiagnosisRunner({
  manhole,
  initialDiagnosis
}: {
  manhole: ManholeDetail;
  initialDiagnosis: Diagnosis | null;
}) {
  const searchParams = useSearchParams();
  const shouldAutorun = searchParams.get("autorun") === "1";
  const [diagnosis, setDiagnosis] = useState<Diagnosis | null>(initialDiagnosis);
  const [progressIndex, setProgressIndex] = useState(initialDiagnosis ? progressMessages.length - 1 : -1);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const runGuardRef = useRef(false);

  const activeMessage = useMemo(() => {
    if (!isRunning || progressIndex < 0) {
      return null;
    }
    return progressMessages[Math.min(progressIndex, progressMessages.length - 1)];
  }, [isRunning, progressIndex]);

  useEffect(() => {
    if (!shouldAutorun || diagnosis || isRunning) {
      return;
    }

    void runDiagnosis();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldAutorun, diagnosis, isRunning]);

  async function runDiagnosis() {
    if (runGuardRef.current) {
      return;
    }
    runGuardRef.current = true;
    setError(null);
    setIsRunning(true);
    setProgressIndex(0);

    const timer = window.setInterval(() => {
      setProgressIndex((current) => {
        if (current >= progressMessages.length - 1) {
          window.clearInterval(timer);
          return current;
        }
        return current + 1;
      });
    }, 540);

    try {
      const result = await createDiagnosis(manhole.id, {
        inspectionVersion: manhole.inspection.inspectionVersion
      });
      startTransition(() => {
        setDiagnosis(result);
      });
    } catch (runError) {
      setError(runError instanceof Error ? runError.message : "研判生成失败");
    } finally {
      window.clearInterval(timer);
      setProgressIndex(progressMessages.length - 1);
      setIsRunning(false);
      runGuardRef.current = false;
    }
  }

  return (
    <div className="stack-lg">
      <div className="page-actions-inline">
        <button type="button" className="button button-primary" onClick={() => void runDiagnosis()} disabled={isRunning}>
          {isRunning ? "AI 研判中…" : diagnosis ? "重新生成研判结果" : "启动 AI 风险研判"}
        </button>
        {diagnosis && !isRunning ? (
          <CreatePlanButton manholeId={manhole.id} diagnosisVersion={diagnosis.diagnosisVersion} />
        ) : null}
      </div>

      <Panel>
        <SectionTitle title="研判进度" eyebrow="AI Pipeline" />
        <div className="progress-stack">
          {progressMessages.map((message, index) => (
            <div
              key={message}
              className={`progress-item ${index <= progressIndex ? "progress-item-active" : ""} ${!isRunning && diagnosis && index <= progressIndex ? "progress-item-complete" : ""}`}
            >
              <span>{index + 1}</span>
              <p>{message}</p>
            </div>
          ))}
        </div>
        {activeMessage ? <p className="active-progress-copy">{activeMessage}</p> : null}
      </Panel>

      {error ? (
        <ErrorState title="研判生成失败" description={error} />
      ) : null}

      {diagnosis ? (
        <>
          <Panel className="hero-banner">
            <div className="hero-banner-head">
              <div>
                <p className="eyebrow">AI Assessment</p>
                <h2>
                  {diagnosis.diseaseLevel} 级 / 风险评分 {diagnosis.riskScore}
                </h2>
                <p className="flow-subtitle">{diagnosis.summary}</p>
              </div>
              <StagePill tone={diagnosis.requiresReview ? "warning" : "success"}>
                {diagnosis.requiresReview ? "需复核后再定方案" : "已生成处置建议"}
              </StagePill>
            </div>
            <div className="summary-grid">
              <div className="summary-card">
                <span className="summary-label">异常分区</span>
                <strong className="summary-value">{diagnosis.findings.length} 处</strong>
                <span className="summary-caption">每处异常都保留深度和置信度说明</span>
              </div>
              <div className="summary-card">
                <span className="summary-label">主要病害</span>
                <strong className="summary-value">{diagnosis.primaryDiseases.length} 类</strong>
                <span className="summary-caption">{diagnosis.primaryDiseases.map(getDiseaseLabel).join("、")}</span>
              </div>
              <div className="summary-card">
                <span className="summary-label">异常深度</span>
                <strong className="summary-value">
                  {diagnosis.depthMinCm}-{diagnosis.depthMaxCm} cm
                </strong>
                <span className="summary-caption">可直接对应注浆与锁固控制范围</span>
              </div>
              <div className="summary-card">
                <span className="summary-label">建议动作</span>
                <strong className="summary-value">{diagnosis.requiresReview ? "先复核" : "生成工单"}</strong>
                <span className="summary-caption">{diagnosis.recommendedStrategy}</span>
              </div>
            </div>
          </Panel>

          <div className="two-column">
            <Panel>
            <SectionTitle title="地下病害可视化" eyebrow="Assessment View" />
            <DiagnosisVisual diagnosis={diagnosis} />
            </Panel>
            <Panel>
              <SectionTitle
                title="研判结论"
                eyebrow="Result"
                action={<StagePill tone={diagnosis.requiresReview ? "warning" : "success"}>{diagnosis.requiresReview ? "需复核" : "可进入方案"}</StagePill>}
              />
              <DataList
                items={[
                  { label: "病害等级", value: `${diagnosis.diseaseLevel} 级` },
                  { label: "风险评分", value: `${diagnosis.riskScore} / 100` },
                  { label: "主要病害", value: diagnosis.primaryDiseases.map(getDiseaseLabel).join("、") },
                  { label: "深度范围", value: `${diagnosis.depthMinCm}-${diagnosis.depthMaxCm} cm` },
                  { label: "置信度", value: `${Math.round(diagnosis.confidence * 100)}%` },
                  { label: "空洞估算", value: `${diagnosis.estimatedVoidVolumeLiters} L` }
                ]}
              />
              <p className="result-summary">{diagnosis.summary}</p>
              <div className="factor-stack">
                {diagnosis.ruleFactors.map((factor) => (
                  <div key={factor.label} className="factor-item">
                    <strong>{factor.label}</strong>
                    <span>+{factor.scoreImpact}</span>
                    <p>{factor.evidence}</p>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        </>
      ) : (
        <Panel className="state-panel">
          <h3>等待启动 AI 风险研判</h3>
          <p>本页将把监测与巡检证据转成可解释的等级、异常分区和处置建议。</p>
        </Panel>
      )}
    </div>
  );
}
