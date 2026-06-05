import { DiseaseLevel, RiskLevel } from "@/lib/types";
import { GradePill, RiskPill, StagePill } from "@/components/ui";

const flowSteps = [
  { key: "detail", label: "一井一档" },
  { key: "diagnosis", label: "AI研判" },
  { key: "plan", label: "处置方案" },
  { key: "simulation", label: "施工监管" },
  { key: "acceptance", label: "验收归档" }
] as const;

export function FlowHeader({
  title,
  subtitle,
  manhole,
  currentStep,
  prevHref,
  nextHref,
  nextLabel
}: {
  title: string;
  subtitle: string;
  manhole: {
    code: string;
    roadName: string;
    riskLevel: RiskLevel;
    riskScore: number;
    diseaseLevel: DiseaseLevel;
  };
  currentStep: (typeof flowSteps)[number]["key"];
  prevHref?: string;
  nextHref?: string;
  nextLabel?: string;
}) {
  return (
    <header className="flow-header">
      <div className="flow-header-main">
        <div>
          <p className="eyebrow">{manhole.code}</p>
          <h1>{title}</h1>
          <p className="flow-subtitle">{subtitle}</p>
        </div>
        <div className="flow-header-tags">
          <StagePill>{manhole.roadName}</StagePill>
          <RiskPill value={manhole.riskLevel} />
          <GradePill value={manhole.diseaseLevel} />
          <StagePill tone="warning">风险评分 {manhole.riskScore}</StagePill>
        </div>
      </div>
      <div className="flow-track" aria-label="主流程阶段">
        {flowSteps.map((step, index) => (
          <div
            key={step.key}
            className={`flow-step ${step.key === currentStep ? "flow-step-active" : ""} ${index < flowSteps.findIndex((item) => item.key === currentStep) ? "flow-step-complete" : ""}`}
          >
            <span>{index + 1}</span>
            <strong>{step.label}</strong>
          </div>
        ))}
      </div>
      <div className="flow-actions">
        {prevHref ? (
          <a href={prevHref} className="button button-ghost">
            返回上一环节
          </a>
        ) : (
          <span />
        )}
        {nextHref ? (
          <a href={nextHref} className="button button-primary">
            {nextLabel ?? "进入下一环节"}
          </a>
        ) : null}
      </div>
    </header>
  );
}
