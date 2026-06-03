import { ActionLink, EmptyState } from "@/components/ui";

export default function NotFound() {
  return (
    <EmptyState
      title="未找到检查井或页面"
      description="请从地图或路演脚本重新进入主流程。"
      action={<ActionLink href="/map">返回地图页</ActionLink>}
    />
  );
}
