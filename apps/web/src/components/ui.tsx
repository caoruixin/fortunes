import Link from "next/link";
import { ReactNode } from "react";

import { DiseaseLevel, RiskLevel } from "@/lib/types";
import { cn } from "@/lib/utils";

const riskClassName: Record<RiskLevel, string> = {
  low: "pill-risk-a",
  medium: "pill-risk-b",
  high: "pill-risk-c",
  critical: "pill-risk-d"
};

const gradeClassName: Record<DiseaseLevel, string> = {
  A: "pill-risk-a",
  B: "pill-risk-b",
  C: "pill-risk-c",
  D: "pill-risk-d"
};

export function Panel({
  children,
  className
}: {
  children: ReactNode;
  className?: string;
}) {
  return <section className={cn("panel", className)}>{children}</section>;
}

export function SectionTitle({
  title,
  eyebrow,
  action
}: {
  title: string;
  eyebrow?: string;
  action?: ReactNode;
}) {
  return (
    <div className="section-title">
      <div>
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h2>{title}</h2>
      </div>
      {action ? <div>{action}</div> : null}
    </div>
  );
}

export function MetricCard({
  label,
  value,
  detail
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <Panel className="metric-card">
      <p className="metric-label">{label}</p>
      <p className="metric-value">{value}</p>
      <p className="metric-detail">{detail}</p>
    </Panel>
  );
}

export function RiskPill({ value }: { value: RiskLevel }) {
  return <span className={cn("pill", riskClassName[value])}>{riskCopy[value]}</span>;
}

export function GradePill({ value }: { value: DiseaseLevel }) {
  return <span className={cn("pill", gradeClassName[value])}>{value} 级</span>;
}

export function StagePill({
  children,
  tone = "default"
}: {
  children: ReactNode;
  tone?: "default" | "success" | "warning";
}) {
  return <span className={cn("pill", `pill-${tone}`)}>{children}</span>;
}

export function DataList({
  items
}: {
  items: Array<{ label: string; value: ReactNode }>;
}) {
  return (
    <dl className="data-list">
      {items.map((item) => (
        <div key={item.label} className="data-item">
          <dt>{item.label}</dt>
          <dd>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function EmptyState({
  title,
  description,
  action
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <Panel className="state-panel">
      <h3>{title}</h3>
      <p>{description}</p>
      {action ? <div className="state-action">{action}</div> : null}
    </Panel>
  );
}

export function LoadingState({ message }: { message: string }) {
  return (
    <Panel className="state-panel">
      <div className="loading-line" />
      <div className="loading-line loading-line-short" />
      <p>{message}</p>
    </Panel>
  );
}

export function ErrorState({
  title,
  description,
  action
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <Panel className="state-panel state-panel-error">
      <h3>{title}</h3>
      <p>{description}</p>
      {action ? <div className="state-action">{action}</div> : null}
    </Panel>
  );
}

export function DemoGuide({
  title = "下一步演示",
  description,
  href,
  label,
  meta
}: {
  title?: string;
  description: string;
  href: string;
  label: string;
  meta?: string;
}) {
  return (
    <Panel className="demo-guide">
      <div>
        {meta ? <p className="eyebrow">{meta}</p> : null}
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
      <Link href={href} className="button button-primary">
        {label}
      </Link>
    </Panel>
  );
}

export function ActionLink({
  href,
  children,
  variant = "primary"
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
}) {
  return (
    <Link href={href} className={cn("button", `button-${variant}`)}>
      {children}
    </Link>
  );
}

const riskCopy: Record<RiskLevel, string> = {
  low: "正常监测",
  medium: "一级预警",
  high: "二级告警",
  critical: "三级报警"
};
