# Data Model Draft

后续由 `manhole-database-designer` 细化为 PostgreSQL/PostGIS schema。

## Core Tables
- `projects`: 项目或试点工程。
- `roads`: 道路信息。
- `manholes`: 检查井资产。
- `inspection_records`: 检测记录。
- `radar_scans`: 雷达扫描和剖面数据。
- `flatness_measurements`: 平整度检测。
- `noise_measurements`: 声振检测。
- `defect_detections`: AI 识别病害。
- `repair_plans`: 维修方案。
- `grouting_points`: 注浆孔位。
- `construction_logs`: 施工过程数据。
- `material_batches`: 材料批次。
- `acceptance_reports`: 验收报告。
- `users`: Demo 用户。

## Key Fields

### `manholes`
- `id`
- `code`
- `project_id`
- `road_id`
- `location_geom`
- `manhole_type`
- `pipeline_type`
- `owner_unit`
- `traffic_level`
- `last_repair_at`
- `repair_count`
- `risk_score`
- `status`

### `inspection_records`
- `id`
- `manhole_id`
- `inspected_at`
- `height_diff_mm`
- `flatness_mm`
- `noise_peak_db`
- `crack_length_m`
- `radar_anomaly_area_m2`
- `suspected_void_depth_min_cm`
- `suspected_void_depth_max_cm`
- `surface_photo_url`

### `defect_detections`
- `id`
- `manhole_id`
- `inspection_record_id`
- `defect_type`
- `severity`
- `depth_min_cm`
- `depth_max_cm`
- `confidence`
- `polygon_geojson`
- `diagnosis_summary`

### `repair_plans`
- `id`
- `manhole_id`
- `disease_level`
- `recommended_method`
- `recommended_materials`
- `estimated_duration_minutes`
- `estimated_open_traffic_hours`
- `estimated_grout_liters`
- `expected_garbage_reduction_percent`

### `construction_logs`
- `id`
- `repair_plan_id`
- `step`
- `started_at`
- `ended_at`
- `pressure_mpa`
- `flow_lpm`
- `grout_liters`
- `surface_lift_mm`
- `alarm_status`

### `acceptance_reports`
- `id`
- `manhole_id`
- `repair_plan_id`
- `report_no`
- `flatness_before_mm`
- `flatness_after_mm`
- `height_diff_before_mm`
- `height_diff_after_mm`
- `noise_before_db`
- `noise_after_db`
- `open_traffic_at`
- `recurrence_risk_3m`
- `recurrence_risk_6m`
- `recurrence_risk_12m`
- `conclusion`
