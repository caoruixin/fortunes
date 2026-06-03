import Link from "next/link";
import { notFound } from "next/navigation";

import { CreateAcceptanceButton } from "@/components/create-acceptance-button";
import { FlowHeader } from "@/components/flow-header";
import { Panel, SectionTitle } from "@/components/ui";
import { TelemetryChart } from "@/components/telemetry-chart";
import { getManholeDetail, getRepairPlan, getSimulation } from "@/lib/api";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function SimulationPage({ params }: Props) {
  const { id } = await params;
  const [manhole, plan, simulation] = await Promise.all([
    getManholeDetail(id),
    getRepairPlan(id),
    getSimulation(id)
  ]);

  if (!manhole || !plan || !simulation) {
    notFound();
  }

  const peakPressure = Math.max(...simulation.telemetry.map((point) => point.pressureMpa), 0);
  const peakUplift = Math.max(...simulation.telemetry.map((point) => point.upliftMm), 0);
  const totalGrout = simulation.telemetry[simulation.telemetry.length - 1]?.accumulatedVolumeLiters ?? 0;

  return (
    <div className="stack-lg">
      <FlowHeader
        title="施工模拟"
        subtitle="展示精准布孔、低压分级注浆、井座锁固调平和快硬恢复四步施工过程。"
        manhole={manhole}
        currentStep="simulation"
        prevHref={`/manholes/${manhole.id}/plan`}
        nextHref={`/manholes/${manhole.id}/acceptance`}
        nextLabel="下一步演示：生成验收报告"
      />

      <div className="summary-grid">
        <div className="summary-card">
          <span className="summary-label">峰值压力</span>
          <strong className="summary-value">{peakPressure.toFixed(2)} MPa</strong>
          <span className="summary-caption">低压分级注浆，避免无控顶升</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">累计注浆</span>
          <strong className="summary-value">{totalGrout} L</strong>
          <span className="summary-caption">与方案估算量保持一致，方便讲质控</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">累计抬升</span>
          <strong className="summary-value">{peakUplift.toFixed(1)} mm</strong>
          <span className="summary-caption">演示“控制而不是盲目顶升”</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">开放交通</span>
          <strong className="summary-value">{plan.openTrafficHours} h</strong>
          <span className="summary-caption">与验收报告口径保持一致</span>
        </div>
      </div>

      <div className="two-column">
        <Panel>
          <SectionTitle title="四步施工时间线" eyebrow="Timeline" />
          <div className="timeline-list">
            {simulation.steps.map((step) => (
              <div key={step.id} className="timeline-item">
                <strong>{step.title}</strong>
                <span>{step.durationMinutes} min</span>
                <p>{step.detail}</p>
              </div>
            ))}
          </div>
          <div className="timeline-strip">
            {simulation.timeline.map((item) => (
              <div key={item} className="timeline-chip">
                {item}
              </div>
            ))}
          </div>
        </Panel>

        <Panel>
          <SectionTitle title="施工遥测回放" eyebrow="Telemetry Replay" />
          <TelemetryChart simulation={simulation} />
        </Panel>
      </div>

      <Panel>
        <SectionTitle title="预计修复效果" eyebrow="Expected Outcome" />
        <div className="comparison-grid">
          <div className="comparison-card">
            <span className="summary-label">井盖高差</span>
            <strong className="summary-value">
              {manhole.inspection.heightDiffMm} mm {"->"} 目标 &lt;= 2 mm
            </strong>
            <span className="summary-caption">从“跳盖感知”过渡到量化验收</span>
          </div>
          <div className="comparison-card">
            <span className="summary-label">平整度</span>
            <strong className="summary-value">
              {manhole.inspection.flatnessMm} mm {"->"} 目标 &lt;= 3 mm
            </strong>
            <span className="summary-caption">提前埋下验收对比锚点</span>
          </div>
          <div className="comparison-card">
            <span className="summary-label">异响峰值</span>
            <strong className="summary-value">
              {manhole.inspection.noisePeakDb} dB {"->"} 无明显异常冲击声
            </strong>
            <span className="summary-caption">保持对外话术可量化、可验收</span>
          </div>
        </div>
      </Panel>

      <div className="two-column">
        <Panel>
          <SectionTitle title="修复前状态" eyebrow="Before" />
          <p className="result-summary">{simulation.beforeAfterVisualState.before}</p>
          <div className="drawer-photo">井周沉陷 / 异响 / 雷达异常占位</div>
        </Panel>
        <Panel>
          <SectionTitle title="修复后状态" eyebrow="After" />
          <p className="result-summary">{simulation.beforeAfterVisualState.after}</p>
          <div className="drawer-photo">承压层恢复 / 交通开放倒计时占位</div>
          <div className="page-actions-inline">
            <CreateAcceptanceButton manholeId={manhole.id} planVersion={plan.planVersion} />
            <Link href={`/manholes/${manhole.id}/plan`} className="button button-ghost">
              返回方案页
            </Link>
          </div>
        </Panel>
      </div>
    </div>
  );
}
