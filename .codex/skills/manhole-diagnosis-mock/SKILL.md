---
name: manhole-diagnosis-mock
description: Use this skill to design and implement deterministic, engineering-plausible mock AI diagnosis, risk scoring, disease classification, heatmap/polygon data, grouting recommendations, material estimates, open-traffic estimates, and recurrence risk for 井周智修.
---

# Manhole Diagnosis Mock

Read first:
- `AGENTS.md`
- `references/solution.md`
- `references/demo-requirements.md`
- `references/domain-glossary.md`
- `references/acceptance-criteria.md`

## Inputs
Use available inspection fields:
- height difference;
- flatness;
- noise peak;
- radar anomaly area;
- suspected void depth;
- historical repair count;
- traffic level;
- road class.

## Outputs
Must include:
- `riskScore`;
- `diseaseLevel`: A/B/C/D;
- defect types and confidence;
- depth range;
- heatmap or polygon data;
- recommended repair method;
- grouting point count;
- estimated grout volume;
- estimated open traffic time;
- recurrence risk.

## Scoring Rules
Use transparent weighted scoring. A reasonable starting point:
- height difference: 15%;
- flatness: 15%;
- noise peak: 15%;
- radar anomaly area: 25%;
- void depth: 15%;
- repair count: 10%;
- traffic level: 5%.

Map score to level:
- A: 0-39;
- B: 40-64;
- C: 65-84;
- D: 85-100 or critical triggers such as deep void plus suspected leakage.

## Validation
Write tests for A/B/C/D examples. The same input must always produce the same output.

## Return
- formula;
- code/data changed;
- test results;
- limitations and replacement path for a real model.
