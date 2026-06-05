import type { Route } from "next";
import Link from "next/link";

import { DemoGuide, EmptyState, Panel, SectionTitle, StagePill } from "@/components/ui";
import { getDemoScript, getManholeDetail } from "@/lib/api";

const platformDemoSteps = [
  {
    id: "dashboard",
    title: "监测总览",
    summary: "先看示范片区纳管管井、今日告警、待处置工单和闭环达标率。",
    route: "/dashboard",
    talkingPoints: ["谛听不是单点修复工具，而是监测、研判、处置、归档的一体化平台。", "多源感知接入智能井盖、AI视觉巡检和探地雷达。"]
  },
  {
    id: "map",
    title: "GIS 告警态势",
    summary: "从全域地图选择二级橙色告警井 JW-A-0007，进入固定讲解路径。",
    route: "/map?focus=mh-0007",
    talkingPoints: ["地图按告警等级、管线类型和处置状态组织。", "二级橙色告警井适合展示地下隐患专项研判。"]
  },
  {
    id: "archive",
    title: "一井一档",
    summary: "查看单井基础档案、监测指标、雷达异常和历史处置记录。",
    route: "/manholes/mh-0007",
    talkingPoints: ["一口井对应一套完整数字档案。", "井盖高差、声振峰值、雷达异常共同解释为什么要处置。"]
  },
  {
    id: "assessment",
    title: "AI 风险研判",
    summary: "把多源证据转成风险评分、病害等级、异常分区和处置建议。",
    route: "/manholes/mh-0007/diagnosis?autorun=1",
    talkingPoints: ["研判结果不是黑箱，保留评分依据、深度范围和置信度。", "C 级病害进入微创处置闭环，D 级保留复核退出机制。"]
  },
  {
    id: "plan",
    title: "处置方案",
    summary: "平台把研判结果转成可派发工单，明确工法、材料、孔位和开放交通目标。",
    route: "/manholes/mh-0007/plan",
    talkingPoints: ["推荐微孔注浆、井座锁固和快硬材料恢复。", "工单参数包括压力范围、注浆量、孔位数量和预计时长。"]
  },
  {
    id: "supervision",
    title: "施工监管",
    summary: "回放处置过程，展示布孔、分级注浆、锁固调平和过程遥测。",
    route: "/manholes/mh-0007/simulation",
    talkingPoints: ["处置不是大开挖，而是可监测、可控制、可追溯。", "压力、流量和抬升数据用于质控。"]
  },
  {
    id: "acceptance",
    title: "验收归档",
    summary: "形成一井一档验收档案，沉淀材料批次、处置记录、复检建议和归档入口。",
    route: "/manholes/mh-0007/acceptance",
    talkingPoints: ["用处置前后指标证明结果。", "验收状态下无明显跳动、空响和异常冲击声。"]
  }
];

export default async function DemoScriptPage() {
  const script = await getDemoScript();
  const recommendedManhole = await getManholeDetail(script.recommendedManholeId);

  if (platformDemoSteps.length === 0) {
    return (
      <EmptyState
        title="暂无演示脚本"
        description="当前暂未同步演示脚本，请稍后刷新或回到监测总览。"
        action={<Link href="/dashboard" className="button button-primary">返回监测总览</Link>}
      />
    );
  }

  return (
    <div className="stack-lg">
      <header className="flow-header">
        <div className="flow-header-main">
          <div>
            <p className="eyebrow">Demo Script</p>
            <h1>标准演示路径</h1>
            <p className="flow-subtitle">谛听监测管理平台讲解路径：先看全域风险，再看单井证据，再看研判与处置，最后看验收归档。</p>
          </div>
          <div className="flow-header-tags">
            <StagePill>
              推荐井位 {recommendedManhole ? recommendedManhole.code : "JW-A-0007"}
            </StagePill>
            <Link href={`/manholes/${script.recommendedManholeId}`} className="button button-primary">
              从固定演示井开始
            </Link>
          </div>
        </div>
      </header>

      <div className="summary-grid">
        <div className="summary-card">
          <span className="summary-label">固定告警井</span>
          <strong className="summary-value">
            {recommendedManhole ? recommendedManhole.code : script.recommendedManholeId}
          </strong>
          <span className="summary-caption">{recommendedManhole ? recommendedManhole.roadName : "固定客户演示案例"}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">演示步骤</span>
          <strong className="summary-value">{platformDemoSteps.length} 节点</strong>
          <span className="summary-caption">总览、地图、档案、研判、方案、监管、归档</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">建议时长</span>
          <strong className="summary-value">5-8 min</strong>
          <span className="summary-caption">适合领导听完价值闭环</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">主叙事</span>
          <strong className="summary-value">监测 {"->"} 研判 {"->"} 闭环</strong>
          <span className="summary-caption">全程围绕告警、工单、归档三件事</span>
        </div>
      </div>

      <DemoGuide
        meta="讲解顺序"
        title="推荐 5-8 分钟讲完"
        description="按监测总览、GIS 态势、一井一档、AI 风险研判、处置方案、施工监管、验收归档的顺序推进，避免现场自由跳页。"
        href="/dashboard"
        label="从监测总览重新开始"
      />

      <section className="two-column">
        <Panel>
          <SectionTitle title="开场 30 秒定位" eyebrow="Opening Narrative" />
          <div className="timeline-list">
            <div className="timeline-item">
              <strong>一句话</strong>
              <p>谛听是管井及周边道路的智能监测管理平台，不只是单井维修页面。</p>
            </div>
            <div className="timeline-item">
              <strong>四层能力</strong>
              <p>数据采集层、AI诊断基座、监测管理平台、工单处置移动端共同形成闭环。</p>
            </div>
            <div className="timeline-item">
              <strong>固定案例</strong>
              <p>用 JW-A-0007 展示从二级告警发现到验收归档的完整链路。</p>
            </div>
          </div>
        </Panel>

        <Panel>
          <SectionTitle title="客户侧价值表达" eyebrow="Value Proof" />
          <div className="value-proof-grid">
            <div>
              <strong>看得见</strong>
              <p>地图和一井一档把隐患证据集中呈现。</p>
            </div>
            <div>
              <strong>判得准</strong>
              <p>AI研判输出评分、等级、异常范围和置信度。</p>
            </div>
            <div>
              <strong>派得下去</strong>
              <p>处置方案直接转成工法、孔位、材料和时间目标。</p>
            </div>
            <div>
              <strong>收得回来</strong>
              <p>施工过程、验收指标和复检建议沉淀为一井一档。</p>
            </div>
          </div>
        </Panel>
      </section>

      <div className="stack-lg">
        {platformDemoSteps.map((step, index) => (
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
