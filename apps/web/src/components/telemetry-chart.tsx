import { ConstructionSimulation } from "@/lib/types";

export function TelemetryChart({
  simulation
}: {
  simulation: ConstructionSimulation;
}) {
  const maxPressure = Math.max(...simulation.telemetry.map((point) => point.pressureMpa), 0.2);
  const maxVolume = Math.max(...simulation.telemetry.map((point) => point.accumulatedVolumeLiters), 1);

  return (
    <div className="telemetry-chart">
      {simulation.telemetry.map((point) => (
        <div key={point.minute} className="telemetry-row">
          <div className="telemetry-meta">
            <strong>T+{point.minute} min</strong>
            <span>{point.alertStatus === "watch" ? "接近阈值" : point.alertStatus === "stop" ? "暂停" : "正常"}</span>
          </div>
          <div className="telemetry-bars">
            <div
              className="telemetry-bar telemetry-bar-pressure"
              style={{ width: `${(point.pressureMpa / maxPressure) * 100}%` }}
            />
            <div
              className="telemetry-bar telemetry-bar-volume"
              style={{ width: `${(point.accumulatedVolumeLiters / maxVolume) * 100}%` }}
            />
          </div>
          <p className="telemetry-values">
            {point.pressureMpa.toFixed(2)} MPa / {point.accumulatedVolumeLiters} L / 抬升 {point.upliftMm.toFixed(1)} mm
          </p>
        </div>
      ))}
    </div>
  );
}
