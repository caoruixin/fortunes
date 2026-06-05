import Link from "next/link";

import { getMapManholes } from "@/lib/api";
import { MapWorkspace } from "@/components/map-workspace";
import { DemoGuide, EmptyState } from "@/components/ui";

export default async function MapPage() {
  const features = await getMapManholes();

  if (features.length === 0) {
    return (
      <EmptyState
        title="GIS 暂无管井数据"
        description="当前区域暂未同步管井点位，请稍后刷新或切换示范片区。"
        action={
          <Link href="/dashboard" className="button button-primary">
            返回监测总览
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
            <p className="eyebrow">GIS Situation</p>
            <h1>城市管井 GIS 告警态势</h1>
            <p className="flow-subtitle">按告警等级、管线类型和工单状态查看管井隐患，选择二级橙色告警井进入处置闭环。</p>
          </div>
        </div>
      </header>
      <DemoGuide
        meta="固定演示路线"
        description="建议直接选中 JW-A-0007。它是二级橙色告警样例，适合讲清多源监测、AI研判、派单处置和归档闭环。"
        href="/manholes/mh-0007"
        label="下一步演示：进入重点告警井"
      />
      <MapWorkspace features={features} />
    </div>
  );
}
