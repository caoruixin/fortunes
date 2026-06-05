import { notFound } from "next/navigation";

import { DiagnosisRunner } from "@/components/diagnosis-runner";
import { FlowHeader } from "@/components/flow-header";
import { getDiagnosis, getManholeDetail } from "@/lib/api";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ autorun?: string }>;
};

export default async function DiagnosisPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { autorun } = await searchParams;
  const [manhole, diagnosis] = await Promise.all([
    getManholeDetail(id),
    autorun === "1" ? Promise.resolve(null) : getDiagnosis(id)
  ]);

  if (!manhole) {
    notFound();
  }

  return (
    <div className="stack-lg">
      <FlowHeader
        title="AI 风险研判"
        subtitle="融合巡检、声振和雷达异常，生成可解释、可复核的风险等级、异常分区和处置建议。"
        manhole={manhole}
        currentStep="diagnosis"
        prevHref={`/manholes/${manhole.id}`}
      />
      <DiagnosisRunner manhole={manhole} initialDiagnosis={diagnosis} />
    </div>
  );
}
