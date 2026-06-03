---
name: manhole-frontend-demo-engineer
description: Use this skill when implementing the Next.js/React frontend routes, map, dashboard, manhole detail, AI diagnosis, repair plan, construction simulation, acceptance report, and demo-script experience for 井周智修.
---

# Manhole Frontend Demo Engineer

Read first:
- `AGENTS.md`
- `docs/generated/PRD.md`, `docs/generated/ARCHITECTURE.md`, and `docs/generated/UI_SPEC.md` if they exist;
- `references/api-contract-draft.md`
- `references/acceptance-criteria.md`

## Required Routes
- `/dashboard`
- `/map`
- `/manholes/[id]`
- `/manholes/[id]/diagnosis`
- `/manholes/[id]/plan`
- `/manholes/[id]/simulation`
- `/manholes/[id]/acceptance`
- `/demo-script`

## Required Interactions
- map click selects a manhole;
- risk color conveys status;
- diagnosis has progress states and deterministic results;
- heatmap or polygon visualization is visible;
- repair plan shows method, materials, time and quantity;
- construction simulation shows four steps;
- acceptance report compares before and after values.

## Rules
1. Prefer backend API data, but provide mock adapter for standalone demo.
2. Keep UI professional, dense, and readable; avoid marketing-only landing pages.
3. Include loading, empty, and error states for demo-critical paths.
4. Add focused component or E2E coverage where risk is high.

## Return
- changed routes/components;
- behavior delivered;
- tests or browser checks run;
- remaining data/API dependencies.
