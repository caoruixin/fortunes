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
        title="AI 诊断"
        subtitle="通过确定性 Mock AI 将井周地下病害转成可解释的异常分区、等级和工法建议。"
        manhole={manhole}
        currentStep="diagnosis"
        prevHref={`/manholes/${manhole.id}`}
      />
      <DiagnosisRunner manhole={manhole} initialDiagnosis={diagnosis} />
    </div>
  );
}
