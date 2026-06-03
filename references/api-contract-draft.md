# API Contract Draft

后续由 `api-designer` 和 `manhole-backend-api-engineer` 细化为 OpenAPI。

## Core Endpoints

```text
GET    /api/projects
GET    /api/roads
GET    /api/manholes
GET    /api/manholes/{id}
POST   /api/manholes/{id}/diagnose
GET    /api/manholes/{id}/diagnosis
POST   /api/manholes/{id}/repair-plan
GET    /api/manholes/{id}/repair-plan
GET    /api/manholes/{id}/construction-simulation
POST   /api/manholes/{id}/acceptance-report
GET    /api/manholes/{id}/acceptance-report
GET    /api/dashboard/summary
GET    /api/demo/high-risk-manhole
```

## Diagnosis Input

```json
{
  "heightDiffMm": -8,
  "flatnessMm": 7.5,
  "noisePeakDb": 82,
  "repairCount": 3,
  "radarAnomalyAreaM2": 1.4,
  "suspectedVoidDepthMinCm": 12,
  "suspectedVoidDepthMaxCm": 45,
  "trafficLevel": "heavy",
  "roadClass": "arterial"
}
```

## Diagnosis Output

```json
{
  "diseaseLevel": "C",
  "riskScore": 86,
  "confidence": 0.9,
  "summary": "井周基层松散伴随局部脱空，建议微孔注浆和井座锁固。",
  "defects": [
    {
      "type": "局部脱空",
      "depthRange": "12-28cm",
      "confidence": 0.92,
      "area": "东南侧",
      "polygon": []
    }
  ],
  "recommendation": {
    "method": "微孔注浆 + 井座锁固 + 快硬材料恢复",
    "openTrafficHours": 2,
    "groutingPoints": 8,
    "estimatedGroutLiters": 42
  }
}
```
