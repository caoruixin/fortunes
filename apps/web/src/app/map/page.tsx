import Link from "next/link";

import { getMapManholes } from "@/lib/api";
import { MapWorkspace } from "@/components/map-workspace";
import { DemoGuide, EmptyState } from "@/components/ui";

export default async function MapPage() {
  const features = await getMapManholes();

  if (features.length === 0) {
    return (
      <EmptyState
        title="地图暂无检查井"
        description="请先加载 seed 数据，或确认后端服务已启动。"
        action={
          <Link href="/dashboard" className="button button-primary">
            返回 Dashboard
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
            <p className="eyebrow">Map</p>
            <h1>城市道路风险地图</h1>
            <p className="flow-subtitle">从风险颜色和历史投诉切入，选择一座高风险检查井进入诊修闭环。</p>
          </div>
        </div>
      </header>
      <DemoGuide
        meta="固定演示路线"
        description="建议直接选中 JW-A-0007。它是 C 级高风险样例，最适合讲清微孔注浆、井座锁固和快硬材料恢复闭环。"
        href="/manholes/mh-0007"
        label="下一步演示：进入 JW-A-0007"
      />
      <MapWorkspace features={features} />
    </div>
  );
}
