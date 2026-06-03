import type { Route } from "next";
import Link from "next/link";

import { DemoGuide, EmptyState, Panel, SectionTitle, StagePill } from "@/components/ui";
import { getDemoScript, getManholeDetail } from "@/lib/api";

export default async function DemoScriptPage() {
  const script = await getDemoScript();
  const recommendedManhole = await getManholeDetail(script.recommendedManholeId);

  if (script.steps.length === 0) {
    return (
      <EmptyState
        title="暂无路演脚本"
        description="请先启动后端服务或补充 demo script 数据。"
        action={<Link href="/dashboard" className="button button-primary">返回 Dashboard</Link>}
      />
    );
  }

  return (
    <div className="stack-lg">
      <header className="flow-header">
        <div className="flow-header-main">
          <div>
            <p className="eyebrow">Demo Script</p>
            <h1>客户路演模式</h1>
            <p className="flow-subtitle">{script.headline}</p>
          </div>
          <div className="flow-header-tags">
            <StagePill>
              推荐井位 {recommendedManhole ? `${recommendedManhole.code} / ${recommendedManhole.id}` : script.recommendedManholeId}
            </StagePill>
            <Link href={`/manholes/${script.recommendedManholeId}`} className="button button-primary">
              从推荐井开始
            </Link>
          </div>
        </div>
      </header>

      <div className="summary-grid">
        <div className="summary-card">
          <span className="summary-label">固定主井</span>
          <strong className="summary-value">
            {recommendedManhole ? recommendedManhole.code : script.recommendedManholeId}
          </strong>
          <span className="summary-caption">{recommendedManhole ? recommendedManhole.roadName : "固定客户演示案例"}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">演示步骤</span>
          <strong className="summary-value">{script.steps.length} 步</strong>
          <span className="summary-caption">避免现场自由跳转，降低讲解负担</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">建议时长</span>
          <strong className="summary-value">5-8 min</strong>
          <span className="summary-caption">适合领导听完价值闭环</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">主叙事</span>
          <strong className="summary-value">看见 {"->"} 判断 {"->"} 验证</strong>
          <span className="summary-caption">全程围绕病害、方案、结果三件事</span>
        </div>
      </div>

      <DemoGuide
        meta="讲解顺序"
        title="推荐 5-8 分钟讲完"
        description="按风险总览、地图选井、单井证据、AI 诊断、维修方案、施工模拟、验收报告的顺序推进，避免现场自由跳页。"
        href="/dashboard"
        label="从 Dashboard 重新开始"
      />

      <div className="stack-lg">
        {script.steps.map((step, index) => (
          <Panel key={step.id} className="demo-step">
            <div className="demo-step-head">
              <div>
                <p className="eyebrow">Step {index + 1}</p>
                <h2>{step.title}</h2>
                <p className="flow-subtitle">{step.summary}</p>
              </div>
              <Link href={step.route as Route} className="button button-secondary">
                跳转此步骤
              </Link>
            </div>
            <SectionTitle title="讲解提示" eyebrow="Talking Points" />
            <ul className="demo-step-points">
              {step.talkingPoints.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </Panel>
        ))}
      </div>
    </div>
  );
}
