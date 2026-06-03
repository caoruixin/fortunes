import { Diagnosis } from "@/lib/types";
import { getDiseaseLabel } from "@/lib/mock-data";

export function DiagnosisVisual({ diagnosis }: { diagnosis: Diagnosis }) {
  return (
    <div className="diagnosis-visual">
      <div className="diagnosis-canvas" role="img" aria-label="井周病害异常分区示意图">
        <div className="diagnosis-center">井盖中心</div>
        {diagnosis.findings.map((finding) => (
          <div
            key={finding.id}
            className={`diagnosis-zone diagnosis-zone-${finding.disease}`}
            style={{
              clipPath: `polygon(${finding.polygon.map((point) => `${(point.x + 1) * 50}% ${(point.y + 1) * 50}%`).join(",")})`
            }}
          />
        ))}
      </div>
      <div className="legend-list">
        {diagnosis.findings.map((finding) => (
          <div key={finding.id} className="legend-item">
            <span className={`legend-dot legend-dot-${finding.disease}`} />
            <div>
              <strong>{finding.zoneName}</strong>
              <p>
                {getDiseaseLabel(finding.disease)} / {finding.depthMinCm}-{finding.depthMaxCm} cm / 置信度{" "}
                {Math.round(finding.confidence * 100)}%
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
