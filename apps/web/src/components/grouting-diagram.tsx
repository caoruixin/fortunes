import { GroutingPoint } from "@/lib/types";

export function GroutingDiagram({ points }: { points: GroutingPoint[] }) {
  return (
    <div className="grouting-diagram">
      <div className="grouting-disc" role="img" aria-label="井周注浆孔位示意图">
        <div className="grouting-center">井盖</div>
        {points.map((point) => {
          const angle = (point.positionAngleDeg * Math.PI) / 180;
          const radius = point.distanceFromCoverCm > 50 ? 42 : 32;
          const x = 50 + Math.cos(angle) * radius;
          const y = 50 + Math.sin(angle) * radius;
          return (
            <div
              key={point.pointNo}
              className="grouting-point"
              style={{ left: `${x}%`, top: `${y}%` }}
            >
              {point.pointNo}
            </div>
          );
        })}
      </div>
    </div>
  );
}
