import { notFound } from "next/navigation";

import { FlowHeader } from "@/components/flow-header";
import { Panel, SectionTitle, StagePill } from "@/components/ui";
import { getAcceptance, getDiagnosis, getManholeDetail, getRepairPlan } from "@/lib/api";
import { getPipelineLabel } from "@/lib/mock-data";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function AcceptancePage({ params }: Props) {
  const { id } = await params;
  const [manhole, diagnosis, plan, report] = await Promise.all([
    getManholeDetail(id),
    getDiagnosis(id),
    getRepairPlan(id),
    getAcceptance(id)
  ]);

  if (!manhole || !diagnosis || !plan || !report) {
    notFound();
  }

  return (
    <div className="stack-lg">
      <FlowHeader
        title="一井一档验收报告"
        subtitle="用修复前后指标、材料批次、施工记录和复检建议形成可追溯验收闭环。"
        manhole={manhole}
        currentStep="acceptance"
        prevHref={`/manholes/${manhole.id}/simulation`}
        nextHref="/demo-script"
        nextLabel="下一步演示：进入路演讲解页"
      />

      <div className="summary-grid">
        <div className="summary-card">
          <span className="summary-label">井盖高差</span>
          <strong className="summary-value">
            {report.beforeMetrics.heightDiffMm} {"->"} {report.afterMetrics.heightDiffMm} mm
          </strong>
          <span className="summary-caption">从跳盖风险转为可量化达标状态</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">平整度</span>
          <strong className="summary-value">
            {report.beforeMetrics.flatnessMm} {"->"} {report.afterMetrics.flatnessMm} mm
          </strong>
          <span className="summary-caption">突出修复前后对比冲击力</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">异响峰值</span>
          <strong className="summary-value">
            {report.beforeMetrics.noisePeakDb} {"->"} {report.afterMetrics.noisePeakDb} dB
          </strong>
          <span className="summary-caption">客户可直接理解“异常冲击声已消失”</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">开放交通</span>
          <strong className="summary-value">{report.reopenTrafficAt}</strong>
          <span className="summary-caption">保持对外承诺克制且可验收</span>
        </div>
      </div>

      <Panel className="report-sheet">
        <div className="report-head">
          <div>
            <p className="eyebrow">Acceptance Report</p>
            <h2>{manhole.code} 检查井验收档案</h2>
            <p className="report-note">
              {manhole.roadName} / {manhole.district} / {getPipelineLabel(manhole.pipeType)}
            </p>
          </div>
          <div className="flow-header-tags">
            <StagePill tone={report.acceptanceStatus === "passed" ? "success" : "warning"}>
              {report.acceptanceStatus === "passed" ? "验收通过" : "复核中"}
            </StagePill>
            <StagePill>{report.reopenTrafficAt}</StagePill>
          </div>
        </div>

        <div className="acceptance-impact-row">
          <div>
            <span>井盖高差</span>
            <strong>
              {report.beforeMetrics.heightDiffMm} mm {"->"} {report.afterMetrics.heightDiffMm} mm
            </strong>
          </div>
          <div>
            <span>三米直尺平整度</span>
            <strong>
              {report.beforeMetrics.flatnessMm} mm {"->"} {report.afterMetrics.flatnessMm} mm
            </strong>
          </div>
          <div>
            <span>异响峰值</span>
            <strong>
              {report.beforeMetrics.noisePeakDb} dB {"->"} {report.afterMetrics.noisePeakDb} dB
            </strong>
          </div>
          <div>
            <span>验收状态</span>
            <strong>无明显跳动、空响和异常冲击声</strong>
          </div>
        </div>

        <div className="report-grid">
          <div className="stack-lg">
            <div>
              <SectionTitle title="修复前后指标对比" eyebrow="Before / After" />
              <table className="report-table">
                <thead>
                  <tr>
                    <th>指标</th>
                    <th>修复前</th>
                    <th>修复后</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>井盖高差</td>
                    <td>{report.beforeMetrics.heightDiffMm} mm</td>
                    <td className={report.acceptanceStatus === "passed" ? "report-positive" : "report-warning"}>
                      {report.afterMetrics.heightDiffMm} mm
                    </td>
                  </tr>
                  <tr>
                    <td>平整度</td>
                    <td>{report.beforeMetrics.flatnessMm} mm</td>
                    <td className={report.acceptanceStatus === "passed" ? "report-positive" : "report-warning"}>
                      {report.afterMetrics.flatnessMm} mm
                    </td>
                  </tr>
                  <tr>
                    <td>异响峰值</td>
                    <td>{report.beforeMetrics.noisePeakDb} dB</td>
                    <td className={report.acceptanceStatus === "passed" ? "report-positive" : "report-warning"}>
                      {report.afterMetrics.noisePeakDb} dB
                    </td>
                  </tr>
                  <tr>
                    <td>沉陷量</td>
                    <td>{report.beforeMetrics.settlementMm} mm</td>
                    <td className={report.acceptanceStatus === "passed" ? "report-positive" : "report-warning"}>
                      {report.afterMetrics.settlementMm} mm
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div>
              <SectionTitle title="诊断与施工摘要" eyebrow="Summary" />
              <ul className="report-list">
                <li>
                  <strong>诊断结论</strong>
                  <p>{report.diagnosisSummary}</p>
                </li>
                <li>
                  <strong>方案摘要</strong>
                  <p>{report.repairPlanSummary}</p>
                </li>
                <li>
                  <strong>施工记录</strong>
                  <p>{report.constructionRecords.join("；")}</p>
                </li>
              </ul>
            </div>
          </div>

          <div className="stack-lg">
            <div>
              <SectionTitle title="材料批次" eyebrow="Material Batches" />
              <ul className="report-list">
                {report.materialBatches.map((batch) => (
                  <li key={batch.batchNo}>
                    <strong>{batch.materialName}</strong>
                    <p>
                      {batch.batchNo} / {batch.supplier} / {batch.producedAt}
                    </p>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <SectionTitle title="复检建议" eyebrow="Follow-up" />
              <ul className="report-list">
                <li>
                  <strong>复发风险</strong>
                  <p>{report.recurrenceRisk}</p>
                </li>
                <li>
                  <strong>后续建议</strong>
                  <p>{report.followUpRecommendation}</p>
                </li>
                <li>
                  <strong>二维码占位</strong>
                  <div className="report-qr">一井一档归档入口</div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </Panel>
    </div>
  );
}
