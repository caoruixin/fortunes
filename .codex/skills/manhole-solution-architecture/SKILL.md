---
name: manhole-solution-architecture
description: Use this skill when designing the full-stack architecture, module boundaries, API contracts, data flow, local deployment shape, and MVP engineering scope for the 井周智修 demo.
---

# Manhole Solution Architecture

Read first:
- `AGENTS.md`
- `docs/generated/PRD.md` if it exists;
- `references/solution.md`
- `references/demo-requirements.md`
- `references/api-contract-draft.md`
- `references/data-model-draft.md`

## Default Stack
- Frontend: Next.js, React, TypeScript.
- UI: Tailwind CSS and shadcn/ui style components.
- Map: Leaflet by default; Mapbox only if token is available.
- Backend: FastAPI.
- Database: PostgreSQL plus PostGIS.
- API: OpenAPI.
- Local delivery: Docker Compose.
- Tests: Pytest, Playwright, Vitest where useful.

## Workflow
1. Define bounded modules for frontend, backend, data, mock AI, reports, and demo assets.
2. Specify API boundaries and shared schemas.
3. Define data flow from seed data to diagnosis and report output.
4. Keep local one-command startup as a hard requirement.
5. Call out tradeoffs and unresolved dependencies.

## Output
Create or update `docs/generated/ARCHITECTURE.md` with:
- system diagram in text or Mermaid;
- repo structure;
- module responsibilities;
- API boundaries;
- database and seed strategy;
- mock AI integration;
- local startup flow;
- testing strategy;
- MVP scope and later upgrade path.
