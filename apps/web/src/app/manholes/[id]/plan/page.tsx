import Link from "next/link";
import { notFound } from "next/navigation";

import { FlowHeader } from "@/components/flow-header";
import { GroutingDiagram } from "@/components/grouting-diagram";
import { DataList, Panel, SectionTitle, StagePill } from "@/components/ui";
import { getDiagnosis, getManholeDetail, getRepairPlan } from "@/lib/api";
import { getMethodLabel } from "@/lib/mock-data";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function PlanPage({ params }: Props) {
  const { id } = await params;
  const [manhole, diagnosis, plan] = await Promise.all([
    getManholeDetail(id),
    getDiagnosis(id),
    getRepairPlan(id)
  ]);

  if (!manhole || !diagnosis || !plan) {
    notFound();
  }

  return (
    <div className="stack-lg">
      <FlowHeader
        title="处置方案"
        subtitle="把 AI 研判结果转成可派发工单，明确处置组合、材料、孔位、工期和开放交通目标。"
        manhole={manhole}
        currentStep="plan"
        prevHref={`/manholes/${manhole.id}/diagnosis`}
        nextHref={`/manholes/${manhole.id}/simulation`}
        nextLabel="下一步演示：查看施工监管"
      />

      <div className="summary-grid">
        <div className="summary-card">
          <span className="summary-label">推荐处置组合</span>
          <strong className="summary-value">{plan.recommendedMethods.length} 项</strong>
          <span className="summary-caption">{plan.recommendedMethods.map(getMethodLabel).join(" / ")}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">注浆总量</span>
          <strong className="summary-value">{plan.estimatedGroutLiters} L</strong>
          <span className="summary-caption">控制分级注浆并同步监测抬升</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">预计处置时长</span>
          <strong className="summary-value">{plan.estimatedDurationMinutes} min</strong>
          <span className="summary-caption">适合客户演示“微创快修”优势</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">开放交通</span>
          <strong className="summary-value">{plan.openTrafficHours ? `${plan.openTrafficHours} h` : "待复核"}</strong>
          <span className="summary-caption">路演话术建议与验收目标保持一致</span>
        </div>
      </div>

      <div className="two-column">
        <Panel>
          <SectionTitle
            title="推荐处置组合"
            eyebrow="Work Order Strategy"
            action={<StagePill tone={diagnosis.requiresReview ? "warning" : "success"}>{diagnosis.requiresReview ? "复核分支" : "微创闭环"}</StagePill>}
          />
          <p className="result-summary">{plan.strategySummary}</p>
          <div className="report-tags">
            {plan.recommendedMethods.map((method) => (
              <StagePill key={method}>{getMethodLabel(method)}</StagePill>
            ))}
          </div>
          <div className="detail-grid" style={{ marginTop: 16 }}>
            <DataList
              items={[
                { label: "注浆压力", value: `${plan.pressureRangeMpa[0].toFixed(2)}-${plan.pressureRangeMpa[1].toFixed(2)} MPa` },
                { label: "注浆总量", value: `${plan.estimatedGroutLiters} L` },
                { label: "表层恢复", value: `${plan.surfaceRepairAreaM2} m2` },
                { label: "处置时长", value: `${plan.estimatedDurationMinutes} min` }
              ]}
            />
            <DataList
              items={[
                { label: "开放交通", value: plan.openTrafficHours ? `${plan.openTrafficHours} h` : "待复核" },
                { label: "异常深度", value: `${diagnosis.depthMinCm}-${diagnosis.depthMaxCm} cm` },
                { label: "孔位数量", value: `${plan.groutingPoints.length} 个` },
                { label: "风险提示", value: `${plan.riskWarnings.length} 条` }
              ]}
            />
          </div>
        </Panel>

        <Panel>
          <SectionTitle title="注浆孔位示意" eyebrow="Grouting Layout" />
          {plan.groutingPoints.length > 0 ? (
            <>
              <GroutingDiagram points={plan.groutingPoints} />
              <div className="timeline-list">
                {plan.groutingPoints.map((point) => (
                  <div key={point.pointNo} className="timeline-item">
                    <strong>{point.pointNo}</strong>
                    <p>
                      {point.positionAngleDeg}° / 距井座 {point.distanceFromCoverCm} cm / 深度 {point.depthCm} cm
                    </p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <Panel className="state-panel">
              <h3>当前井位不建议直接布孔注浆</h3>
              <p>检测结果为 D 级，系统保留 CCTV 复核与局部开挖退出机制。</p>
            </Panel>
          )}
        </Panel>
      </div>

      <div className="two-column">
        <Panel>
          <SectionTitle title="材料清单" eyebrow="Materials" />
          <div className="timeline-list">
            {plan.materials.map((material) => (
              <div key={material.name} className="timeline-item">
                <strong>{material.name}</strong>
                <p>
                  {material.role} / {material.dosage}
                </p>
              </div>
            ))}
          </div>
        </Panel>
        <Panel>
          <SectionTitle title="处置质控与风险提示" eyebrow="Quality Controls" />
          <ul className="demo-step-points">
            {plan.qualityControls.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <ul className="demo-step-points">
            {plan.riskWarnings.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <div className="page-actions-inline">
            <Link href={`/manholes/${manhole.id}/simulation`} className="button button-primary">
              下一步演示：进入施工监管
            </Link>
          </div>
        </Panel>
      </div>
    </div>
  );
}
