import Link from "next/link";

import { DEMO_MANHOLE_ID, getPipelineLabel, getWorkflowStatusLabel } from "@/lib/mock-data";
import { getDashboardSummary, getManholeDetail } from "@/lib/api";
import { DemoGuide, EmptyState, MetricCard, Panel, SectionTitle, StagePill } from "@/components/ui";
import { formatDate, formatNumber } from "@/lib/utils";

export default async function DashboardPage() {
  const [summary, demoManhole] = await Promise.all([getDashboardSummary(), getManholeDetail(DEMO_MANHOLE_ID)]);
  const topRiskItems = demoManhole
    ? [
        {
          manholeId: demoManhole.id,
          code: demoManhole.code,
          roadName: demoManhole.roadName,
          riskScore: demoManhole.riskScore,
          riskLevel: demoManhole.riskLevel,
          isDemo: true
        },
        ...summary.topRisks
          .filter((item) => item.manholeId !== demoManhole.id)
          .slice(0, 4)
          .map((item) => ({ ...item, isDemo: false }))
      ]
    : summary.topRisks.map((item) => ({ ...item, isDemo: false }));

  if (summary.totals.manholes === 0) {
    return (
      <EmptyState
        title="暂无井档数据"
        description="请先加载 seed 数据，或确认后端服务已启动。"
        action={
          <Link href="/map" className="button button-primary">
            前往风险地图
          </Link>
        }
      />
    );
  }

  return (
    <div className="stack-lg">
      <header className="flow-header">
        <div className="flow-header-main">
          <div>
            <p className="eyebrow">Dashboard</p>
            <h1>道路检查井风险总览</h1>
            <p className="flow-subtitle">
              展示全市示范片区 20 座 seed 检查井的风险分布、处置进度和近期待验收动态。
            </p>
          </div>
          <div className="flow-header-tags">
            <Link href="/demo-script" className="button button-primary">
              进入路演模式
            </Link>
            <Link href={`/map?focus=${DEMO_MANHOLE_ID}`} className="button button-secondary">
              下一步演示：打开风险地图
            </Link>
          </div>
        </div>
      </header>

      <DemoGuide
        meta="固定演示路线"
        description="本次客户演示固定从风险地图选择 JW-A-0007 / mh-0007，一路走到 AI 诊断、维修方案、施工模拟和一井一档验收报告。"
        href={`/map?focus=${DEMO_MANHOLE_ID}`}
        label="下一步演示：打开风险地图"
      />

      {demoManhole ? (
        <Panel className="hero-banner">
          <div className="hero-banner-head">
            <div>
              <p className="eyebrow">Featured Manhole</p>
              <h2>
                {demoManhole.code} / {demoManhole.roadName}
              </h2>
              <p className="flow-subtitle">
                固定主井用于完整展示 C 级病害从地下异常识别到修复验收的闭环，不需要临场切换其他案例。
              </p>
            </div>
            <div className="flow-header-tags">
              <StagePill>{getPipelineLabel(demoManhole.pipeType)}</StagePill>
              <StagePill tone="warning">{getWorkflowStatusLabel(demoManhole.status)}</StagePill>
            </div>
          </div>
          <div className="summary-grid">
            <div className="summary-card">
              <span className="summary-label">修复前高差</span>
              <strong className="summary-value">{demoManhole.inspection.heightDiffMm} mm</strong>
              <span className="summary-caption">客户一眼可见的表观问题</span>
            </div>
            <div className="summary-card">
              <span className="summary-label">异响峰值</span>
              <strong className="summary-value">{demoManhole.inspection.noisePeakDb} dB</strong>
              <span className="summary-caption">适合讲解跳盖异响与承载层不足</span>
            </div>
            <div className="summary-card">
              <span className="summary-label">异常深度</span>
              <strong className="summary-value">
                {demoManhole.inspection.suspectedVoidDepthMinCm}-{demoManhole.inspection.suspectedVoidDepthMaxCm} cm
              </strong>
              <span className="summary-caption">适合展示微孔注浆 + 井座锁固</span>
            </div>
            <div className="summary-card">
              <span className="summary-label">验收后平整度</span>
              <strong className="summary-value">目标 &lt;= 3 mm</strong>
              <span className="summary-caption">把结果先亮出来，再倒叙讲方案更稳</span>
            </div>
          </div>
          <div className="page-actions-inline">
            <Link href={`/manholes/${demoManhole.id}`} className="button button-primary">
              进入固定主井
            </Link>
            <Link href={`/manholes/${demoManhole.id}/acceptance`} className="button button-secondary">
              直接查看验收结果
            </Link>
          </div>
        </Panel>
      ) : null}

      <section className="metric-grid">
        <MetricCard
          label="高风险检查井"
          value={formatNumber(summary.totals.highRiskManholes)}
          detail={`总井数 ${summary.totals.manholes} / 当前数据 ${formatDate(summary.generatedAt)}`}
        />
        <MetricCard
          label="本周待处置"
          value={formatNumber(summary.totals.plannedManholes)}
          detail="含已出方案与待进施工模拟井位"
        />
        <MetricCard
          label="平均开放交通"
          value={`${summary.averageOpenTrafficHours} h`}
          detail="C 级示范井默认 2 小时开放交通"
        />
        <MetricCard
          label="复检达标率"
          value={`${summary.reinspectionPassRate}%`}
          detail="修复后平整度、声振与高差复检通过率"
        />
      </section>

      <section className="three-column">
        <Panel>
          <SectionTitle title="风险分布" eyebrow="Risk Distribution" />
          <div className="bar-list">
            {summary.riskDistribution.map((item) => (
              <div key={item.riskLevel} className="bar-item">
                <div className="bar-meta">
                  <strong>{item.riskLevel}</strong>
                  <span>{item.count} 座</span>
                </div>
                <div className="bar-track">
                  <div
                    className={`bar-fill risk-${item.riskLevel}`}
                    style={{ width: `${(item.count / summary.totals.manholes) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel>
          <SectionTitle title="病害等级分布" eyebrow="Disease Grade" />
          <div className="bar-list">
            {summary.gradeDistribution.map((item) => (
              <div key={item.diseaseLevel} className="bar-item">
                <div className="bar-meta">
                  <strong>{item.diseaseLevel} 级</strong>
                  <span>{item.count} 座</span>
                </div>
                <div className="bar-track">
                  <div
                    className={`bar-fill risk-${item.diseaseLevel === "A" ? "low" : item.diseaseLevel === "B" ? "medium" : item.diseaseLevel === "C" ? "high" : "critical"}`}
                    style={{ width: `${(item.count / summary.totals.manholes) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel>
          <SectionTitle title="高风险井清单" eyebrow="Priority Queue" />
          <ul className="risk-list">
            {topRiskItems.map((item) => (
              <li key={item.manholeId} className="timeline-item">
                <strong>
                  {item.code}
                  {item.isDemo ? <span className="demo-badge">固定演示</span> : null}
                </strong>
                <p>
                  {item.roadName} / 评分 {item.riskScore}
                </p>
                <Link href={`/manholes/${item.manholeId}`} className="button button-secondary">
                  进入井档
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
      </section>

      <Panel>
        <SectionTitle title="近期施工与验收动态" eyebrow="Recent Activities" />
        <div className="timeline-list">
          {summary.recentActivities.map((activity) => (
            <div key={activity.id} className="timeline-item">
              <strong>{activity.title}</strong>
              <span>{formatDate(activity.happenedAt)}</span>
              <p>{activity.detail}</p>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
