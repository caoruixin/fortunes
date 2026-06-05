import Link from "next/link";
import { notFound } from "next/navigation";

import { RadarPreview } from "@/components/radar-preview";
import { FlowHeader } from "@/components/flow-header";
import { DataList, Panel, SectionTitle, StagePill } from "@/components/ui";
import { getManholeDetail } from "@/lib/api";
import { getPipelineLabel, getTrafficLabel, getWorkflowStatusLabel } from "@/lib/mock-data";
import { formatDate } from "@/lib/utils";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ManholeDetailPage({ params }: Props) {
  const { id } = await params;
  const manhole = await getManholeDetail(id);

  if (!manhole) {
    notFound();
  }

  return (
    <div className="stack-lg">
      <FlowHeader
        title="单井监测档案"
        subtitle="汇集现场指标、地下异常、历史处置与当前告警原因，形成平台级一井一档。"
        manhole={manhole}
        currentStep="detail"
        nextHref={`/manholes/${manhole.id}/diagnosis?autorun=1`}
        nextLabel="下一步演示：启动 AI 风险研判"
      />

      <div className="two-column">
        <Panel>
          <div className="detail-hero">
            <div className="detail-hero-main">
              <SectionTitle title={`${manhole.code} / ${manhole.roadName}`} eyebrow="Asset Archive" />
              <p className="flow-subtitle">
                {manhole.district} / {getPipelineLabel(manhole.pipeType)} / {manhole.coverType}
              </p>
            </div>
            <StagePill tone={manhole.status === "accepted" ? "success" : "warning"}>
              {getWorkflowStatusLabel(manhole.status)}
            </StagePill>
          </div>

          <div className="summary-grid">
            <div className="summary-card">
              <span className="summary-label">井盖高差</span>
              <strong className="summary-value">{manhole.inspection.heightDiffMm} mm</strong>
              <span className="summary-caption">井盖高差已超过验收目标范围</span>
            </div>
            <div className="summary-card">
              <span className="summary-label">声振异常</span>
              <strong className="summary-value">{manhole.inspection.noisePeakDb} dB</strong>
              <span className="summary-caption">车辆通过存在跳动与异响风险</span>
            </div>
            <div className="summary-card">
              <span className="summary-label">地下异常区</span>
              <strong className="summary-value">{manhole.inspection.radarAnomalyAreaM2} m2</strong>
              <span className="summary-caption">雷达异常区已形成连续结构风险</span>
            </div>
          </div>

          <div className="photo-grid">
            {manhole.inspection.photoAssets.map((asset) => (
              <div key={asset}>{asset}</div>
            ))}
          </div>

          <div className="detail-grid" style={{ marginTop: 16 }}>
            <DataList
              items={[
                { label: "最近检测", value: formatDate(manhole.lastInspectedAt) },
                { label: "上次维修", value: formatDate(manhole.lastRepairedAt) },
                { label: "投诉次数", value: `${manhole.complaintCount} 次` },
                { label: "交通荷载", value: getTrafficLabel(manhole.trafficLevel) }
              ]}
            />
            <DataList
              items={[
                { label: "井盖高差", value: `${manhole.inspection.heightDiffMm} mm` },
                { label: "平整度", value: `${manhole.inspection.flatnessMm} mm` },
                { label: "异响峰值", value: `${manhole.inspection.noisePeakDb} dB` },
                { label: "沉陷量", value: `${manhole.inspection.settlementMm} mm` }
              ]}
            />
          </div>
        </Panel>

        <div className="stack-lg">
          <Panel>
            <SectionTitle title="雷达扫描预览" eyebrow="GPR Snapshot" />
            <RadarPreview label={manhole.inspection.radarPreviewLabel} />
            <p className="result-summary">{manhole.inspection.gprSummary}</p>
          </Panel>
          <Panel>
            <SectionTitle title="历史维修记录" eyebrow="Maintenance" />
            <div className="timeline-list">
              {manhole.history.map((item) => (
                <div key={item.occurredAt} className="timeline-item">
                  <strong>{item.action}</strong>
                  <span>{formatDate(item.occurredAt)}</span>
                  <p>{item.note}</p>
                </div>
              ))}
            </div>
            <div className="page-actions-inline">
              <Link href={`/manholes/${manhole.id}/diagnosis?autorun=1`} className="button button-primary">
                下一步演示：启动 AI 风险研判
              </Link>
              <Link href="/map" className="button button-ghost">
                返回地图
              </Link>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
