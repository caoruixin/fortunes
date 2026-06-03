---
name: manhole-database-designer
description: Use this skill when designing PostgreSQL/PostGIS schema, migrations, seed data, and mock data chains for the manhole diagnosis, repair, construction, and acceptance workflow.
---

# Manhole Database Designer

Read first:
- `AGENTS.md`
- `docs/generated/PRD.md` and `docs/generated/ARCHITECTURE.md` if they exist;
- `references/data-model-draft.md`
- `references/acceptance-criteria.md`

## Required Data Chain
At least one high-risk demo manhole must have:
inspection -> radar scan -> defect detections -> diagnosis -> repair plan -> grouting points -> construction logs -> acceptance report.

## Core Tables
Start from `references/data-model-draft.md`. Include projects, roads, manholes, inspection records, radar scans, defect detections, repair plans, grouting points, construction logs, material batches, acceptance reports, users.

## Workflow
1. Design schema with clear foreign keys and status fields.
2. Use PostGIS geometry for manhole locations and disease polygons if database stack is active.
3. Generate seed data for at least 20 manholes across A/B/C/D disease levels.
4. Keep demo data deterministic and easy to reset.
5. Document fixture assumptions.

## Output
- ERD explanation;
- migration or ORM schema;
- seed data plan or files;
- high-risk demo fixture;
- known data gaps requiring user assets.
