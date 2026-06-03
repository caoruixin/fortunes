export function RadarPreview({ label }: { label: string }) {
  return (
    <div className="radar-preview" role="img" aria-label={label}>
      <div className="scan-grid" />
      <div className="scan-layer scan-layer-1">面层</div>
      <div className="scan-layer scan-layer-2">基层</div>
      <div className="scan-layer scan-layer-3">路基</div>
      <div className="scan-void scan-void-main">脱空区</div>
      <div className="scan-void scan-void-secondary">松散区</div>
      <div className="scan-axis">井周雷达剖面</div>
    </div>
  );
}
