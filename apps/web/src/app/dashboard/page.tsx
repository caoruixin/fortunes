import Link from "next/link";

import { DEMO_MANHOLE_ID, getPipelineLabel, getWorkflowStatusLabel } from "@/lib/mock-data";
import { getDashboardSummary, getManholeDetail } from "@/lib/api";
import { DemoGuide, EmptyState, MetricCard, Panel, SectionTitle, StagePill } from "@/components/ui";
import { formatDate, formatNumber } from "@/lib/utils";

const alertLevelLabels = {
  low: "正常监测",
  medium: "一级预警",
  high: "二级告警",
  critical: "三级报警"
} as const;

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
        description="当前区域暂未同步管井档案，请稍后刷新或切换示范片区。"
        action={
          <Link href="/map" className="button button-primary">
            前往 GIS 态势
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
            <p className="eyebrow">Monitoring Dashboard</p>
            <h1>管井智能监测管理总览</h1>
            <p className="flow-subtitle">
              谛听汇聚智能井盖传感器、AI视觉巡检、探地雷达和养护工单，一屏掌握管井及周边道路隐患。
            </p>
          </div>
          <div className="flow-header-tags">
            <Link href="/demo-script" className="button button-primary">
              进入演示脚本
            </Link>
            <Link href={`/map?focus=${DEMO_MANHOLE_ID}`} className="button button-secondary">
              下一步演示：打开 GIS 态势
            </Link>
          </div>
        </div>
      </header>

      <DemoGuide
        meta="固定演示路线"
        description="本次客户演示固定从 GIS 态势选择二级橙色告警井 JW-A-0007，一路走到 AI研判、处置方案、施工监管和闭环归档。"
        href={`/map?focus=${DEMO_MANHOLE_ID}`}
        label="下一步演示：打开 GIS 态势"
      />

      {demoManhole ? (
        <Panel className="hero-banner">
          <div className="hero-banner-head">
            <div>
              <p className="eyebrow">Priority Alert</p>
              <h2>
                {demoManhole.code} / {demoManhole.roadName}
              </h2>
              <p className="flow-subtitle">
                重点告警井用于完整展示从多源监测发现异常、AI研判、自动生成处置工单到验收归档的闭环。
              </p>
            </div>
            <div className="flow-header-tags">
              <StagePill>{getPipelineLabel(demoManhole.pipeType)}</StagePill>
              <StagePill tone="warning">{getWorkflowStatusLabel(demoManhole.status)}</StagePill>
            </div>
          </div>
          <div className="summary-grid">
            <div className="summary-card">
              <span className="summary-label">监测告警高差</span>
              <strong className="summary-value">{demoManhole.inspection.heightDiffMm} mm</strong>
              <span className="summary-caption">智能巡检触发的表观风险证据</span>
            </div>
            <div className="summary-card">
              <span className="summary-label">声振告警峰值</span>
              <strong className="summary-value">{demoManhole.inspection.noisePeakDb} dB</strong>
              <span className="summary-caption">适合讲解井盖状态与承载层不足</span>
            </div>
            <div className="summary-card">
              <span className="summary-label">雷达异常深度</span>
              <strong className="summary-value">
                {demoManhole.inspection.suspectedVoidDepthMinCm}-{demoManhole.inspection.suspectedVoidDepthMaxCm} cm
              </strong>
              <span className="summary-caption">探地雷达确认地下隐患范围</span>
            </div>
            <div className="summary-card">
              <span className="summary-label">闭环归档目标</span>
              <strong className="summary-value">目标 &lt;= 3 mm</strong>
              <span className="summary-caption">从告警、工单到验收都有据可查</span>
            </div>
          </div>
          <div className="page-actions-inline">
            <Link href={`/manholes/${demoManhole.id}`} className="button button-primary">
              进入一井一档
            </Link>
            <Link href={`/manholes/${demoManhole.id}/acceptance`} className="button button-secondary">
              直接查看归档结果
            </Link>
          </div>
        </Panel>
      ) : null}

      <section className="metric-grid">
        <MetricCard
          label="今日风险告警"
          value={formatNumber(summary.totals.highRiskManholes)}
          detail={`纳管管井 ${summary.totals.manholes} 座 / 当前数据 ${formatDate(summary.generatedAt)}`}
        />
        <MetricCard
          label="待处置工单"
          value={formatNumber(summary.totals.plannedManholes)}
          detail="含已生成方案、待施工监管和待验收任务"
        />
        <MetricCard
          label="平均恢复交通"
          value={`${summary.averageOpenTrafficHours} h`}
          detail="重点告警井处置后目标 2 小时开放交通"
        />
        <MetricCard
          label="闭环达标率"
          value={`${summary.reinspectionPassRate}%`}
          detail="平整度、声振、高差复核与档案归档通过率"
        />
      </section>

      <section className="three-column">
        <Panel>
          <SectionTitle title="多源感知接入" eyebrow="Sensing Layer" />
          <div className="timeline-list">
            <div className="timeline-item">
              <strong>智能井盖传感器</strong>
              <p>沉降、倾斜、移位和异常震动持续监测。</p>
            </div>
            <div className="timeline-item">
              <strong>AI视觉巡检</strong>
              <p>巡检视频识别裂缝、坑槽、剥落和井周破损。</p>
            </div>
            <div className="timeline-item">
              <strong>探地雷达无损检测</strong>
              <p>对地下空洞、脱空和疏松区做专项确认。</p>
            </div>
          </div>
        </Panel>

        <Panel>
          <SectionTitle title="三级告警机制" eyebrow="Alert Levels" />
          <div className="bar-list">
            <div className="bar-item">
              <div className="bar-meta"><strong>一级预警 蓝色</strong><span>持续观察</span></div>
              <div className="bar-track"><div className="bar-fill risk-low" style={{ width: "35%" }} /></div>
            </div>
            <div className="bar-item">
              <div className="bar-meta"><strong>二级告警 黄色</strong><span>触发复核</span></div>
              <div className="bar-track"><div className="bar-fill risk-medium" style={{ width: "55%" }} /></div>
            </div>
            <div className="bar-item">
              <div className="bar-meta"><strong>三级报警 红色</strong><span>应急处置</span></div>
              <div className="bar-track"><div className="bar-fill risk-critical" style={{ width: "82%" }} /></div>
            </div>
          </div>
        </Panel>

        <Panel>
          <SectionTitle title="工单闭环进度" eyebrow="Work Order Loop" />
          <div className="timeline-list">
            <div className="timeline-item"><strong>监测发现</strong><p>多源数据触发异常告警。</p></div>
            <div className="timeline-item"><strong>AI研判</strong><p>自动生成等级、范围和处置建议。</p></div>
            <div className="timeline-item"><strong>派单处置</strong><p>维修班组接单、施工监管、反馈归档。</p></div>
          </div>
        </Panel>
      </section>

      <section className="three-column">
        <Panel>
          <SectionTitle title="区域风险分布" eyebrow="Risk Distribution" />
          <div className="bar-list">
            {summary.riskDistribution.map((item) => (
              <div key={item.riskLevel} className="bar-item">
                <div className="bar-meta">
                  <strong>{alertLevelLabels[item.riskLevel]}</strong>
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
          <SectionTitle title="重点告警清单" eyebrow="Priority Queue" />
          <ul className="risk-list">
            {topRiskItems.map((item) => (
              <li key={item.manholeId} className="timeline-item">
                <strong>
                  {item.code}
                  {item.isDemo ? <span className="demo-badge">重点告警</span> : null}
                </strong>
                <p>
                  {item.roadName} / 评分 {item.riskScore}
                </p>
                <Link href={`/manholes/${item.manholeId}`} className="button button-secondary">
                  查看档案
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
      </section>

      <Panel>
        <SectionTitle title="监测告警与处置动态" eyebrow="Recent Activities" />
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
