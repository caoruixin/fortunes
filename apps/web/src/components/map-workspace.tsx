"use client";

import Link from "next/link";
import { KeyboardEvent, useDeferredValue, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import { DEMO_MANHOLE_ID, getPipelineLabel, getTrafficLabel } from "@/lib/mock-data";
import { MapFeature, RiskLevel } from "@/lib/types";
import { GradePill, Panel, RiskPill, SectionTitle } from "@/components/ui";
import { formatNumber } from "@/lib/utils";

const riskOptions: Array<{ label: string; value: RiskLevel | "all" }> = [
  { label: "全部告警", value: "all" },
  { label: "二级告警", value: "high" },
  { label: "三级报警", value: "critical" },
  { label: "持续观察", value: "medium" },
  { label: "正常监测", value: "low" }
];

export function MapWorkspace({ features }: { features: MapFeature[] }) {
  const searchParams = useSearchParams();
  const demoFeature = features.find((item) => item.id === DEMO_MANHOLE_ID) ?? null;
  const focusedId = searchParams.get("focus");
  const [riskLevel, setRiskLevel] = useState<RiskLevel | "all">("all");
  const [diagnosisFilter, setDiagnosisFilter] = useState<"all" | "yes" | "no">("all");
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [selectedId, setSelectedId] = useState<string>(
    features.find((item) => item.id === focusedId)?.id ??
      demoFeature?.id ??
      features.find((item) => item.riskLevel === "high" || item.riskLevel === "critical")?.id ??
      features[0]?.id ??
      ""
  );

  const bounds = useMemo(() => {
    if (features.length === 0) {
      return {
        minLon: 121.47,
        maxLon: 121.48,
        minLat: 31.22,
        maxLat: 31.24
      };
    }
    const lons = features.map((item) => item.location.lon);
    const lats = features.map((item) => item.location.lat);
    return {
      minLon: Math.min(...lons),
      maxLon: Math.max(...lons),
      minLat: Math.min(...lats),
      maxLat: Math.max(...lats)
    };
  }, [features]);

  const filtered = useMemo(
    () =>
      features.filter((feature) => {
        const term = deferredSearch.trim().toLowerCase();
        const matchesRisk = riskLevel === "all" || feature.riskLevel === riskLevel;
        const matchesDiagnosis =
          diagnosisFilter === "all" ||
          (diagnosisFilter === "yes" ? feature.hasDiagnosis : !feature.hasDiagnosis);
        const matchesTerm =
          !term ||
          feature.code.toLowerCase().includes(term) ||
          feature.roadName.toLowerCase().includes(term) ||
          feature.district.toLowerCase().includes(term);

        return matchesRisk && matchesDiagnosis && matchesTerm;
      }),
    [deferredSearch, diagnosisFilter, features, riskLevel]
  );

  const ordered = useMemo(
    () =>
      [...filtered].sort((left, right) => {
        if (left.id === DEMO_MANHOLE_ID) {
          return -1;
        }
        if (right.id === DEMO_MANHOLE_ID) {
          return 1;
        }
        return right.riskScore - left.riskScore;
      }),
    [filtered]
  );

  const selected =
    ordered.find((feature) => feature.id === selectedId) ??
    ordered.find((feature) => feature.id === DEMO_MANHOLE_ID) ??
    ordered[0] ??
    null;

  function positionFor(feature: MapFeature) {
    const left =
      ((feature.location.lon - bounds.minLon) / Math.max(0.0001, bounds.maxLon - bounds.minLon)) * 100;
    const top =
      ((bounds.maxLat - feature.location.lat) / Math.max(0.0001, bounds.maxLat - bounds.minLat)) * 100;

    return { left: `${8 + left * 0.84}%`, top: `${10 + top * 0.78}%` };
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, featureId: string) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setSelectedId(featureId);
    }
  }

  function focusDemoManhole() {
    setRiskLevel("all");
    setDiagnosisFilter("all");
    setSearch("");
    setSelectedId(DEMO_MANHOLE_ID);
  }

  return (
    <div className="map-grid">
      <Panel className="map-sidebar">
        <SectionTitle title="告警筛选" eyebrow="GIS Filters" />
        {demoFeature ? (
          <div className="demo-route-card">
            <p className="eyebrow">Priority Alert Route</p>
            <strong>{demoFeature.code} 二级橙色告警井</strong>
            <span>
              {demoFeature.roadName} / C 级病害 / 评分 {demoFeature.riskScore}
            </span>
            <button type="button" className="button button-secondary" onClick={focusDemoManhole}>
              下一步演示：选中 JW-A-0007
            </button>
          </div>
        ) : null}
        <div className="filter-stack">
          <label className="field">
            <span>管井检索</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="按编号 / 道路 / 片区"
            />
          </label>
          <label className="field">
            <span>告警等级</span>
            <select value={riskLevel} onChange={(event) => setRiskLevel(event.target.value as RiskLevel | "all")}>
              {riskOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>研判状态</span>
            <select
              value={diagnosisFilter}
              onChange={(event) => setDiagnosisFilter(event.target.value as "all" | "yes" | "no")}
            >
              <option value="all">全部状态</option>
              <option value="yes">已研判</option>
              <option value="no">待研判</option>
            </select>
          </label>
        </div>
        <div className="map-list" role="listbox" aria-label="检查井列表">
          {ordered.map((feature) => (
            <button
              key={feature.id}
              type="button"
              className={`map-list-item ${selected?.id === feature.id ? "map-list-item-active" : ""}`}
              onClick={() => setSelectedId(feature.id)}
              onKeyDown={(event) => handleKeyDown(event, feature.id)}
            >
              <div className="map-list-item-top">
                <strong>
                  {feature.code}
              {feature.id === DEMO_MANHOLE_ID ? <span className="demo-badge">重点告警</span> : null}
                </strong>
                <RiskPill value={feature.riskLevel} />
              </div>
              <p>{feature.roadName}</p>
              <span>
                {feature.district} / {getPipelineLabel(feature.pipelineType)} / 评分 {feature.riskScore}
              </span>
            </button>
          ))}
          {ordered.length === 0 ? (
            <div className="empty-inline">
              <strong>当前筛选条件下无管井</strong>
              <p>请清除告警或研判筛选后重试。</p>
            </div>
          ) : null}
        </div>
      </Panel>

      <Panel className="map-stage">
        <SectionTitle
          title="全域管井告警态势"
          eyebrow="GIS Alert Map"
          action={<div className="map-legend">告警色: 绿 / 黄 / 橙 / 红</div>}
        />
        <div className="map-canvas">
          <div className="map-road map-road-h" />
          <div className="map-road map-road-h map-road-h-2" />
          <div className="map-road map-road-v" />
          <div className="map-road map-road-v map-road-v-2" />
          <div className="map-gridlines" />
          {ordered.map((feature) => (
            <button
              key={feature.id}
              type="button"
              className={`map-marker map-marker-${feature.riskLevel} ${selected?.id === feature.id ? "map-marker-active" : ""}`}
              style={positionFor(feature)}
              onClick={() => setSelectedId(feature.id)}
              aria-label={`${feature.code} ${feature.roadName}`}
            >
              <span />
            </button>
          ))}
          <div className="map-note">示意 GIS 面板展示管井位置、告警等级和处置状态，不依赖外部底图。</div>
        </div>
      </Panel>

      <Panel className="map-drawer">
        <SectionTitle title={selected ? "选中告警概览" : "待选管井"} eyebrow="Selection" />
        {selected ? (
          <div className="drawer-stack">
            <div className="drawer-photo">巡检影像 / 雷达摘要占位</div>
            <div className="drawer-head">
              <div>
                <h3>{selected.code}</h3>
                <p>{selected.roadName}</p>
              </div>
              <div className="drawer-tags">
                <RiskPill value={selected.riskLevel} />
                <GradePill value={selected.diseaseLevel} />
              </div>
            </div>
            <p className="drawer-copy">
              {selected.district} / {getPipelineLabel(selected.pipelineType)} / 交通荷载 {getTrafficLabel(selected.trafficLevel)}
            </p>
            {selected.id === DEMO_MANHOLE_ID ? (
              <div className="drawer-callout">
                <strong>重点二级告警井</strong>
                <p>
                  建议从这座井开始讲解，再按“一井一档 {"->"} AI研判 {"->"} 处置方案 {"->"} 施工监管 {"->"} 验收归档”推进。
                </p>
              </div>
            ) : null}
            <dl className="drawer-stats">
              <div>
                <dt>告警评分</dt>
                <dd>{formatNumber(selected.riskScore)}</dd>
              </div>
              <div>
                <dt>工单状态</dt>
                <dd>{selected.hasDiagnosis ? "已完成研判" : "待 AI 研判"}</dd>
              </div>
            </dl>
            <div className="drawer-actions">
              <Link href={`/manholes/${selected.id}`} className="button button-primary">
                下一步演示：进入一井一档
              </Link>
              <Link href={`/manholes/${selected.id}/diagnosis?autorun=1`} className="button button-secondary">
                直接查看 AI 研判
              </Link>
            </div>
          </div>
        ) : (
          <div className="empty-inline">
            <strong>地图无可选管井</strong>
            <p>当前筛选下没有可展示的管井告警。</p>
          </div>
        )}
      </Panel>
    </div>
  );
}
